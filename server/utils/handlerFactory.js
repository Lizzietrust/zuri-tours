import { catchAsync } from "./catchAsync.js";
import { AppError } from "./appError.js";
import { sendSuccessResponse, sendNoContent } from "./responseHelper.js";

/* ============================================================
   DELETE FACTORY FUNCTIONS
   ============================================================ */

/**
 * Factory function to delete a single document
 */
export const deleteOne = (Model, options = {}) => {
  const {
    modelName = Model.modelName || "Document",
    beforeDelete = null,
    afterDelete = null,
    populateOptions = null,
    softDelete = false,
    idParam = "id",
    conditions = {},
  } = options;

  return catchAsync(async (req, res, next) => {
    const id = req.params[idParam];

    if (!id) {
      return next(new AppError(`No ${modelName} ID provided`, 400));
    }

    const query = Model.findOne({
      _id: id,
      ...conditions,
    });

    const doc = await query;

    if (!doc) {
      return next(new AppError(`${modelName} not found`, 404));
    }

    if (beforeDelete) {
      await beforeDelete(doc, req, res);
    }

    if (softDelete) {
      doc.isDeleted = true;
      doc.deletedAt = new Date();
      doc.deletedBy = req.user?._id || null;
      await doc.save({ validateBeforeSave: false });
    } else {
      await Model.findByIdAndDelete(id);
    }

    if (afterDelete) {
      await afterDelete(doc, req, res);
    }

    let populatedDoc = null;

    if (populateOptions) {
      const populatedQuery = Model.findById(doc._id);

      if (Array.isArray(populateOptions)) {
        populateOptions.forEach((opt) => populatedQuery.populate(opt));
      } else {
        populatedQuery.populate(populateOptions);
      }
      populatedDoc = await populatedQuery.lean();
    }

    if (softDelete) {
      return sendSuccessResponse(
        res,
        200,
        `${modelName} soft deleted successfully`,
        populatedDoc || doc,
      );
    }

    return sendNoContent(res);
  });
};

export const deleteMany = (Model, options = {}) => {
  const {
    modelName = Model.modelName || "Document",
    beforeBulkDelete = null,
    afterBulkDelete = null,
    softDelete = false,
    conditions = {},
    maxDeleteLimit = 100,
    // eslint-disable-next-line no-unused-vars
    allowedFields: _allowedFields = [],
  } = options;

  return catchAsync(async (req, res, next) => {
    const deleteIds = req.body.ids || req.body.userIds || req.body.tourIds;

    if (!deleteIds || !Array.isArray(deleteIds) || deleteIds.length === 0) {
      return next(
        new AppError(`Please provide an array of ${modelName} IDs`, 400),
      );
    }

    if (deleteIds.length > maxDeleteLimit) {
      return next(
        new AppError(
          `Cannot delete more than ${maxDeleteLimit} ${modelName}s at once`,
          400,
        ),
      );
    }

    const validIds = deleteIds.filter(
      (id) => id && id.match(/^[0-9a-fA-F]{24}$/),
    );

    if (validIds.length === 0) {
      return next(new AppError(`No valid ${modelName} IDs provided`, 400));
    }

    const query = Model.find({
      _id: { $in: validIds },
      ...conditions,
    });

    const docs = await query;

    if (docs.length === 0) {
      return next(new AppError(`No ${modelName}s found to delete`, 404));
    }

    const foundIds = docs.map((doc) => doc._id.toString());
    const notFoundIds = validIds.filter((id) => !foundIds.includes(id));

    if (notFoundIds.length > 0) {
      return next(
        new AppError(
          `Some ${modelName}s not found: ${notFoundIds.join(", ")}`,
          404,
        ),
      );
    }

    if (beforeBulkDelete) {
      await beforeBulkDelete(docs, req, res);
    }

    let result;
    const docIds = docs.map((doc) => doc._id);

    if (softDelete) {
      result = await Model.updateMany(
        { _id: { $in: docIds } },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user?._id || null,
        },
        { runValidators: false },
      );
    } else {
      result = await Model.deleteMany({ _id: { $in: docIds } });
    }

    if (afterBulkDelete) {
      await afterBulkDelete(docs, result, req, res);
    }

    if (softDelete) {
      return sendSuccessResponse(
        res,
        200,
        `${docs.length} ${modelName}s soft deleted successfully`,
        {
          deletedCount: docs.length,
          ids: docIds,
        },
      );
    }

    return sendSuccessResponse(
      res,
      200,
      `${docs.length} ${modelName}s deleted successfully`,
      {
        deletedCount: result.deletedCount || docs.length,
        ids: docIds,
      },
    );
  });
};

/**
 * Factory function for soft delete (restore) functionality
 */
export const restoreOne = (Model, options = {}) => {
  const {
    modelName = Model.modelName || "Document",
    beforeRestore = null,
    afterRestore = null,
    idParam = "id",
  } = options;

  return catchAsync(async (req, res, next) => {
    const id = req.params[idParam];

    if (!id) {
      return next(new AppError(`No ${modelName} ID provided`, 400));
    }

    const doc = await Model.findOne({
      _id: id,
      isDeleted: true,
    });

    if (!doc) {
      return next(new AppError(`Soft-deleted ${modelName} not found`, 404));
    }

    if (beforeRestore) {
      await beforeRestore(doc, req, res);
    }

    doc.isDeleted = false;
    doc.deletedAt = null;
    doc.deletedBy = null;
    await doc.save({ validateBeforeSave: true });

    if (afterRestore) {
      await afterRestore(doc, req, res);
    }

    return sendSuccessResponse(
      res,
      200,
      `${modelName} restored successfully`,
      doc,
    );
  });
};

/**
 * Factory function for permanent delete (hard delete after soft delete)
 */
export const permanentDeleteOne = (Model, options = {}) => {
  const {
    modelName = Model.modelName || "Document",
    beforePermanentDelete = null,
    afterPermanentDelete = null,
    idParam = "id",
  } = options;

  return catchAsync(async (req, res, next) => {
    const id = req.params[idParam];

    if (!id) {
      return next(new AppError(`No ${modelName} ID provided`, 400));
    }

    const doc = await Model.findOne({ _id: id });

    if (!doc) {
      return next(new AppError(`${modelName} not found`, 404));
    }

    if (beforePermanentDelete) {
      await beforePermanentDelete(doc, req, res);
    }

    await Model.findByIdAndDelete(id);

    if (afterPermanentDelete) {
      await afterPermanentDelete(doc, req, res);
    }

    return sendNoContent(res);
  });
};

/**
 * Factory function for cascade delete
 */
export const cascadeDeleteOne = (Model, options = {}) => {
  const {
    modelName = Model.modelName || "Document",
    cascadeModels = [],
    beforeCascadeDelete = null,
    afterCascadeDelete = null,
    idParam = "id",
  } = options;

  return catchAsync(async (req, res, next) => {
    const id = req.params[idParam];

    if (!id) {
      return next(new AppError(`No ${modelName} ID provided`, 400));
    }

    const doc = await Model.findById(id);

    if (!doc) {
      return next(new AppError(`${modelName} not found`, 404));
    }

    if (beforeCascadeDelete) {
      await beforeCascadeDelete(doc, req, res);
    }

    const cascadeResults = {};

    await Promise.all(
      cascadeModels.map(async (cascade) => {
        const { model, foreignField, modelName: cascadeModelName } = cascade;
        const result = await model.deleteMany({ [foreignField]: id });

        cascadeResults[cascadeModelName || model.modelName] = {
          deletedCount: result.deletedCount || 0,
        };
      }),
    );

    await Model.findByIdAndDelete(id);

    if (afterCascadeDelete) {
      await afterCascadeDelete(doc, cascadeResults, req, res);
    }

    return sendSuccessResponse(
      res,
      200,
      `${modelName} and related documents deleted successfully`,
      {
        mainDoc: doc,
        cascadeResults,
      },
    );
  });
};

/* ============================================================
   CREATE FACTORY FUNCTION
   ============================================================ */

/**
 * Factory function to create a single document
 */
export const createOne = (Model, options = {}) => {
  const {
    modelName = Model.modelName || "Document",
    beforeCreate = null,
    afterCreate = null,
    populateOptions = null,
    allowedFields = [],
    blockedFields = [],
    defaultData = {},
    transformData = null,
    filterData = null,
    sendResponse = true,
    statusCode = 201,
  } = options;

  return catchAsync(async (req, res, next) => {
    let data = { ...req.body };

    if (transformData) {
      data = await transformData(data, req);
    }

    if (filterData) {
      data = await filterData(data, req);
    } else {
      if (allowedFields.length > 0) {
        data = Object.keys(data)
          .filter((key) => allowedFields.includes(key))
          .reduce((obj, key) => {
            obj[key] = data[key];

            return obj;
          }, {});
      }

      if (blockedFields.length > 0) {
        blockedFields.forEach((field) => {
          delete data[field];
        });
      }
    }

    const defaults =
      typeof defaultData === "function" ? await defaultData(req) : defaultData;

    data = { ...defaults, ...data };

    if (beforeCreate) {
      data = (await beforeCreate(data, req, res)) || data;
    }

    const doc = await Model.create(data);

    if (afterCreate) {
      await afterCreate(doc, req, res);
    }

    let populatedDoc = doc;

    if (populateOptions) {
      const popOpts =
        typeof populateOptions === "function"
          ? await populateOptions(req)
          : populateOptions;

      const populatedQuery = Model.findById(doc._id);

      if (Array.isArray(popOpts)) {
        popOpts.forEach((opt) => populatedQuery.populate(opt));
      } else {
        populatedQuery.populate(popOpts);
      }

      populatedDoc = await populatedQuery.lean();
    }

    if (!sendResponse) {
      req.createdDoc = populatedDoc;

      return next();
    }

    return sendSuccessResponse(
      res,
      statusCode,
      `${modelName} created successfully`,
      populatedDoc,
    );
  });
};

/* ============================================================
   UPDATE FACTORY FUNCTIONS
   ============================================================ */

/**
 * Factory function to update a single document
 */
export const updateOne = (Model, options = {}) => {
  const {
    modelName = Model.modelName || "Document",
    beforeUpdate = null,
    afterUpdate = null,
    populateOptions = null,
    allowedFields = [],
    blockedFields = [],
    transformData = null,
    filterData = null,
    idParam = "id",
    conditions = {},
    returnOriginal = false,
    runValidators = true,
    checkOwnership = null,
    select = null,
  } = options;

  return catchAsync(async (req, res, next) => {
    const id = req.params[idParam];

    if (!id) {
      return next(new AppError(`No ${modelName} ID provided`, 400));
    }

    const existingDoc = await Model.findOne({
      _id: id,
      ...conditions,
    });

    if (!existingDoc) {
      return next(new AppError(`${modelName} not found`, 404));
    }

    if (checkOwnership) {
      await checkOwnership(existingDoc, req, res);
    }

    let data = { ...req.body };

    if (transformData) {
      data = await transformData(data, existingDoc, req);
    }

    if (filterData) {
      data = await filterData(data, existingDoc, req);
    } else {
      if (allowedFields.length > 0) {
        data = Object.keys(data)
          .filter((key) => allowedFields.includes(key))
          .reduce((obj, key) => {
            obj[key] = data[key];

            return obj;
          }, {});
      }

      if (blockedFields.length > 0) {
        blockedFields.forEach((field) => {
          delete data[field];
        });
      }
    }

    if (beforeUpdate) {
      data = (await beforeUpdate(data, existingDoc, req, res)) || data;
    }

    const updatedDoc = await Model.findByIdAndUpdate(existingDoc._id, data, {
      new: !returnOriginal,
      runValidators,
    });

    if (afterUpdate) {
      await afterUpdate(updatedDoc, existingDoc, req, res);
    }

    let populatedDoc = updatedDoc;

    if (populateOptions) {
      const popOpts =
        typeof populateOptions === "function"
          ? await populateOptions(req)
          : populateOptions;

      let populatedQuery = Model.findById(updatedDoc._id);

      if (Array.isArray(popOpts)) {
        popOpts.forEach((opt) => populatedQuery.populate(opt));
      } else {
        populatedQuery.populate(popOpts);
      }

      if (select) {
        populatedQuery = populatedQuery.select(select);
      }

      populatedDoc = await populatedQuery.lean();
    } else if (select) {
      populatedDoc = await Model.findById(updatedDoc._id).select(select).lean();
    }

    return sendSuccessResponse(
      res,
      200,
      `${modelName} updated successfully`,
      populatedDoc,
    );
  });
};

/**
 * Factory function to update multiple documents
 */
export const updateMany = (Model, options = {}) => {
  const {
    modelName = Model.modelName || "Document",
    beforeBulkUpdate = null,
    afterBulkUpdate = null,
    blockedFields = [],
    allowedFields = [],
    idsField = "ids",
    maxUpdateLimit = 100,
    conditions = {},
    checkAuthorization = null,
    returnModified = false,
  } = options;

  return catchAsync(async (req, res, next) => {
    const ids = req.body[idsField];
    const updateData = req.body.updateData || req.body.data;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(
        new AppError(`Please provide an array of ${modelName} IDs`, 400),
      );
    }

    if (ids.length > maxUpdateLimit) {
      return next(
        new AppError(
          `Cannot update more than ${maxUpdateLimit} ${modelName}s at once`,
          400,
        ),
      );
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return next(new AppError("Please provide update data", 400));
    }

    const validIds = ids.filter((id) => id && id.match(/^[0-9a-fA-F]{24}$/));

    if (validIds.length === 0) {
      return next(new AppError(`No valid ${modelName} IDs provided`, 400));
    }

    const cleanData = { ...updateData };

    if (allowedFields.length > 0) {
      Object.keys(cleanData).forEach((key) => {
        if (!allowedFields.includes(key)) delete cleanData[key];
      });
    }

    blockedFields.forEach((field) => {
      delete cleanData[field];
    });

    const docs = await Model.find({
      _id: { $in: validIds },
      ...conditions,
    });

    if (docs.length === 0) {
      return next(new AppError(`No ${modelName}s found to update`, 404));
    }

    if (checkAuthorization) {
      await checkAuthorization(docs, req, res);
    }

    if (beforeBulkUpdate) {
      await beforeBulkUpdate(docs, cleanData, req, res);
    }

    const result = await Model.updateMany(
      { _id: { $in: docs.map((d) => d._id) } },
      cleanData,
      { runValidators: true },
    );

    if (afterBulkUpdate) {
      await afterBulkUpdate(docs, result, req, res);
    }

    let modifiedDocs = null;

    if (returnModified) {
      modifiedDocs = await Model.find({
        _id: { $in: docs.map((d) => d._id) },
      }).lean();
    }

    return sendSuccessResponse(
      res,
      200,
      `${docs.length} ${modelName}s updated successfully`,
      {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        ...(modifiedDocs && { documents: modifiedDocs }),
      },
    );
  });
};

/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

export default {
  deleteOne,
  deleteMany,
  restoreOne,
  permanentDeleteOne,
  cascadeDeleteOne,
  createOne,
  updateOne,
  updateMany,
};

import { catchAsync } from "./catchAsync.js";
import { AppError } from "./appError.js";
import { sendSuccessResponse, sendNoContent } from "./responseHelper.js";

/**
 * Factory function to delete a single document
 * @param {Model} Model - Mongoose model
 * @param {Object} options - Configuration options
 * @param {string} options.modelName - Name of the model (for error messages)
 * @param {Function} options.beforeDelete - Hook to run before deletion (async)
 * @param {Function} options.afterDelete - Hook to run after deletion (async)
 * @param {Function} options.populateOptions - Population options after deletion
 * @param {Function} options.softDelete - Whether to use soft delete (default: false)
 * @param {string} options.idParam - Parameter name for ID (default: 'id')
 * @param {Object} options.conditions - Additional conditions for finding document
 * @returns {Function} Express middleware
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

/**
 * Factory function to delete multiple documents
 * @param {Model} Model - Mongoose model
 * @param {Object} options - Configuration options
 * @param {string} options.modelName - Name of the model (for error messages)
 * @param {Function} options.beforeBulkDelete - Hook to run before deletion (async)
 * @param {Function} options.afterBulkDelete - Hook to run after deletion (async)
 * @param {Function} options.softDelete - Whether to use soft delete (default: false)
 * @param {Object} options.conditions - Additional conditions for finding documents
 * @param {number} options.maxDeleteLimit - Maximum number of documents to delete
 * @param {Array} options.allowedFields - Allowed fields for filtering
 * @returns {Function} Express middleware
 */
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
 * @param {Model} Model - Mongoose model
 * @param {Object} options - Configuration options
 * @param {string} options.modelName - Name of the model (for error messages)
 * @param {Function} options.beforeRestore - Hook to run before restore (async)
 * @param {Function} options.afterRestore - Hook to run after restore (async)
 * @param {string} options.idParam - Parameter name for ID (default: 'id')
 * @returns {Function} Express middleware
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
 * @param {Model} Model - Mongoose model
 * @param {Object} options - Configuration options
 * @param {string} options.modelName - Name of the model (for error messages)
 * @param {Function} options.beforePermanentDelete - Hook to run before deletion (async)
 * @param {Function} options.afterPermanentDelete - Hook to run after deletion (async)
 * @param {string} options.idParam - Parameter name for ID (default: 'id')
 * @returns {Function} Express middleware
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
 * Factory function for cascade delete (delete related documents)
 * @param {Model} Model - Mongoose model
 * @param {Object} options - Configuration options
 * @param {string} options.modelName - Name of the model (for error messages)
 * @param {Array} options.cascadeModels - Array of { model, foreignField } objects
 * @param {Function} options.beforeCascadeDelete - Hook to run before deletion (async)
 * @param {Function} options.afterCascadeDelete - Hook to run after deletion (async)
 * @param {string} options.idParam - Parameter name for ID (default: 'id')
 * @returns {Function} Express middleware
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

export default {
  deleteOne,
  deleteMany,
  restoreOne,
  permanentDeleteOne,
  cascadeDeleteOne,
};

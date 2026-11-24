import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  guideService,
  type Availability,
  type GuideDashboard,
  type SetTourGuidePayload,
  type TeamData,
} from "@/services/guide";

const errMsg = (err: unknown, fallback: string) =>
  (err as { message?: string })?.message || fallback;

export const useGuideDashboard = () =>
  useQuery({
    queryKey: ["guide", "dashboard"],
    queryFn: guideService.dashboard,
  });

export const useTourRoster = (tourId: string) =>
  useQuery({
    queryKey: ["guide", "roster", tourId],
    queryFn: () => guideService.roster(tourId),
    enabled: Boolean(tourId),
  });

export const useUpdateAvailability = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (p: Partial<Availability>) =>
      guideService.updateAvailability(p),
    onSuccess: (availability) => {
      /* Update the cache right away so the form never flashes old values */
      qc.setQueryData<GuideDashboard>(["guide", "dashboard"], (old) =>
        old ? { ...old, availability } : old,
      );
      qc.invalidateQueries({ queryKey: ["guide", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Availability saved");
    },
    onError: (err) =>
      toast.error("Couldn't save availability", {
        description: errMsg(err, "Something went wrong"),
      }),
  });
};

/* Pass `enabled = false` for users who must not call the lead-guide endpoint */
export const useGuideTeam = (enabled = true) =>
  useQuery({
    queryKey: ["guide", "team"],
    queryFn: guideService.team,
    enabled,
  });

const TEAM_KEY = ["guide", "team"] as const;

export const useSetTourGuide = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: guideService.setTourGuide,

    /* Optimistic update: the UI changes instantly, the server has the final say */
    onMutate: async (vars: SetTourGuidePayload) => {
      await qc.cancelQueries({ queryKey: TEAM_KEY });

      const previous = qc.getQueryData<TeamData>(TEAM_KEY);
      const previousGuides =
        previous?.tours.find((t) => t._id === vars.tourId)?.guides ?? null;

      qc.setQueryData<TeamData>(TEAM_KEY, (old) =>
        old
          ? {
              ...old,
              tours: old.tours.map((t) =>
                t._id !== vars.tourId
                  ? t
                  : {
                      ...t,
                      guides:
                        vars.action === "assign"
                          ? t.guides.includes(vars.guideId)
                            ? t.guides
                            : [...t.guides, vars.guideId]
                          : t.guides.filter((g) => g !== vars.guideId),
                    },
              ),
            }
          : old,
      );

      return { previousGuides };
    },

    onError: (err, vars, ctx) => {
      /* Roll back only the tour that failed */
      if (ctx?.previousGuides) {
        qc.setQueryData<TeamData>(TEAM_KEY, (old) =>
          old
            ? {
                ...old,
                tours: old.tours.map((t) =>
                  t._id === vars.tourId
                    ? { ...t, guides: ctx.previousGuides as string[] }
                    : t,
                ),
              }
            : old,
        );
      }

      toast.error("Couldn't update assignment", {
        description: errMsg(err, "Something went wrong"),
      });
    },

    onSuccess: (res) => toast.success(res?.message ?? "Assignment updated"),

    /* Always re-sync with the server (also refreshes dashboard and rosters) */
    onSettled: () => qc.invalidateQueries({ queryKey: ["guide"] }),
  });
};

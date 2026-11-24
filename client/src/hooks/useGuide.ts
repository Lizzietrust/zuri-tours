import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  guideService,
  type Availability,
  type GuideDashboard,
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

export const useGuideTeam = () =>
  useQuery({ queryKey: ["guide", "team"], queryFn: guideService.team });

export const useSetTourGuide = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: guideService.setTourGuide,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guide"] });
      toast.success("Assignment updated");
    },
    onError: (err) =>
      toast.error("Couldn't update assignment", {
        description: errMsg(err, "Something went wrong"),
      }),
  });
};

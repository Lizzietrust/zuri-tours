import { api } from "@/lib/api";

export type Availability = Record<
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday",
  boolean
>;

export type Departure = {
  tourId: string;
  tourName: string;
  slug: string;
  startDate: string;
  guests: number;
  bookings: number;
};

export type GuideTourSummary = {
  _id: string;
  name: string;
  slug: string;
  imageCover?: string;
  nextDeparture: string | null;
  upcomingGuests: number;
};

export type GuideDashboard = {
  stats: {
    assignedTours: number;
    upcomingDepartures: number;
    upcomingGuests: number;
    rating: number;
    totalReviews: number;
  };
  departures: Departure[];
  tours: GuideTourSummary[];
  availability: Partial<Availability>;
};

export type RosterBooking = {
  _id: string;
  startDate: string;
  guests: number;
  status: string;
  bookingReference?: string;
  user?: { name?: string; photo?: string; phoneNumber?: string } | null;
};

export type RosterGuide = {
  _id: string;
  name: string;
  photo?: string;
  role?: string;
};

export type RosterTour = {
  _id: string;
  name: string;
  slug: string;
  imageCover?: string;
  startDates?: string[];
  duration?: number;
  maxGroupSize?: number;
  difficulty?: string;
  startLocation?: { description?: string; address?: string } | null;
  guides?: RosterGuide[];
};

export type RosterStats = {
  totalBookings: number;
  totalGuests: number;
  upcomingBookings: number;
  upcomingGuests: number;
  upcomingDepartures: number;
  completedBookings: number;
  nextDeparture: string | null;
};

export type TourRoster = {
  tour: RosterTour;
  bookings: RosterBooking[];
  stats: RosterStats;
};

export type TeamData = {
  guides: { _id: string; name: string; email: string; role: string }[];
  tours: { _id: string; name: string; slug: string; guides: string[] }[];
};

export const guideService = {
  dashboard: async (): Promise<GuideDashboard> =>
    (await api.get("/guide/dashboard")).data.data,

  roster: async (tourId: string): Promise<TourRoster> =>
    (await api.get(`/guide/tours/${tourId}/roster`)).data.data,

  updateAvailability: async (
    payload: Partial<Availability>,
  ): Promise<Partial<Availability>> =>
    (await api.patch("/guide/availability", payload)).data.data.availability,

  team: async (): Promise<TeamData> => (await api.get("/guide/team")).data.data,

  setTourGuide: async (p: {
    tourId: string;
    guideId: string;
    action: "assign" | "unassign";
  }) =>
    (
      await api.patch(`/guide/tours/${p.tourId}/guides`, {
        guideId: p.guideId,
        action: p.action,
      })
    ).data,
};

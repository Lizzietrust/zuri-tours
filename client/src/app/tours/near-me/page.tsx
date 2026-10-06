import type { Metadata } from "next";
import NearMeClient from "./NearMeClient";

export const metadata: Metadata = {
  title: "Tours near me | Zuri Tours",
  description:
    "Discover tours and adventures close to your current location on the map.",
};

export default function NearMePage() {
  return <NearMeClient />;
}

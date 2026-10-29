import { Suspense } from "react";
import { AppointmentsScreen } from "@/features/appointments/components/AppointmentsScreen";

export default function AppointmentsPage() {
  // The screen reads ?book= / ?edit= links from Today; static export needs a Suspense boundary for that.
  return (
    <Suspense>
      <AppointmentsScreen />
    </Suspense>
  );
}

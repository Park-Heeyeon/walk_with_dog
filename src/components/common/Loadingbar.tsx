"use client";

import * as React from "react";

import { Progress } from "@/components/ui/progress";

export function Loadingbar() {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 1000);
    return () => clearTimeout(timer);
  }, []);

  return <Progress value={progress} className="w-[50%]" />;
}

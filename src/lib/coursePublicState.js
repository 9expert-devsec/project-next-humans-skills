function clean(x) {
  return String(x || "").trim();
}

export function getCoursePublicState(course) {
  const isUpcoming = !!course?.isUpcoming;
  const tag = clean(course?.upcomingTag);

  const isPublicOpen = isUpcoming && (tag === "open" || tag === "nearly_full");
  const isPublicFull = isUpcoming && tag === "full";
  const shouldShowNotify = !isPublicOpen;

  return {
    isPublicOpen,
    isPublicFull,
    shouldShowNotify,
    upcomingTag: tag,
    publicState: isPublicOpen ? "open" : isPublicFull ? "full" : "none",
  };
}

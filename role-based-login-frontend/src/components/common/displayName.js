export function displayNameFromEmail(email) {
  if (!email || typeof email !== "string") return "User";

  const local = email.split("@")[0] || "User";
  const words = local
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 3);

  if (words.length === 0) return "User";

  return words
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

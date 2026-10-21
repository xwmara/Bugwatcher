// Code hosting sites accepted for commit and repository links
export const ALLOWED_REPO_HOSTS = ["github.com", "gitlab.com", "bitbucket.org"];

// Checks only the format of the link. The server never opens the link itself:
// fetching any URL a user sends would let them make the server call internal
// addresses (a security issue called SSRF).
export const isValidRepoLink = (link) => {
    if (typeof link !== "string") return false;
    try {
        const url = new URL(link.trim());
        return url.protocol === "https:" && ALLOWED_REPO_HOSTS.includes(url.hostname.replace(/^www\./, ""));
    } catch {
        return false;
    }
};

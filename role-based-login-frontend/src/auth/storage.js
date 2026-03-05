export const authStorage = {
  getToken() {
    return sessionStorage.getItem("token");
  },
  getEmail() {
    return sessionStorage.getItem("email");
  },
  getRole() {
    return sessionStorage.getItem("role");
  },
  getUsername() {
    return sessionStorage.getItem("username");
  },
  setSession({ token, email, role, username }) {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("email", email);
    sessionStorage.setItem("role", role);
    if (username) sessionStorage.setItem("username", username);
  },
  clear() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("username");
  },
};

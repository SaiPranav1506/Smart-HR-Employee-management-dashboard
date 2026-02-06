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
  setSession({ token, email, role }) {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("email", email);
    sessionStorage.setItem("role", role);
  },
  clear() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("role");
  },
};

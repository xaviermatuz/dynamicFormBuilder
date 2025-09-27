import { Home, Users, FileText, ActivityIcon, FileUp } from "lucide-react";

export const navItems = [
    { to: "", label: "Home", icon: Home },
    { to: "forms", label: "Forms", icon: FileText },
    { to: "submissions", label: "Submissions", icon: FileUp },
    { to: "users", label: "Users", icon: Users, roles: ["admin"] },
    { to: "logs", label: "Logs", icon: ActivityIcon, roles: ["admin"] },
];

export default navItems;

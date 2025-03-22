import logo from "@/assets/imgs/logo.png";
import { Button } from "../ui/button";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface itemProp {
    name: string;
    path: string;
}
const items: itemProp[] = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/search/doctor" },
    { name: "Contact", path: "/contact" },
]
export default function Header() {
    const location = useLocation();
    return (
        <div className="p-4 border-b-3 border-primary flex flex-wrap items-center justify-around">
            <img src={logo} alt="logo" className="max-w-[300px]" />
            <div className="flex items-center gap-5">
                {
                    items.map((item, index) => (
                        <Link key={index} to={item.path} className={cn(
                            "text-xl",
                            location.pathname === item.path ? "text-primary font-bold" : ""
                        )}>{item.name}</Link>
                    ))
                }
            </div>
            <div className="flex items-center gap-5">
                <Button>Đăng nhập</Button>
            </div>
        </div>
    )
}
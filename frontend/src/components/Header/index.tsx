import { useState } from "react";
import logo from "@/assets/imgs/logo.png";
import { Button } from "../ui/button";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AlignRight, X } from "lucide-react";

interface ItemProp {
    name: string;
    path: string;
}

const items: ItemProp[] = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/search/doctor" },
    { name: "Contact", path: "/contact" },
];

export default function Header() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="p-4 border-b-3 border-primary flex flex-wrap items-center justify-between relative">
            <img src={logo} alt="logo" className="md:max-w-[300px] max-w-[150px]" />

            {/* Nút mở nav */}
            <AlignRight
                size={40}
                className="md:hidden cursor-pointer"
                onClick={() => setIsOpen(true)}
            />

            {/* Nav chính cho màn hình lớn */}
            <div className="md:flex items-center gap-5 hidden">
                {items.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        className={cn(
                            "text-xl",
                            location.pathname === item.path ? "text-primary font-bold" : ""
                        )}
                    >
                        {item.name}
                    </Link>
                ))}
            </div>

            <div className="md:flex items-center gap-5 hidden">
                <Link to="/sign-in" className="text-xl">
                    <Button>Đăng nhập</Button>
                </Link>
            </div>

            {/* Sidebar Nav */}
            <div className={cn(
                "fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 flex justify-between items-center border-b">
                    <span className="text-xl font-bold">Menu</span>
                    <X size={30} className="cursor-pointer" onClick={() => setIsOpen(false)} />
                </div>
                <div className="flex flex-col p-4 gap-4">
                    {items.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className="text-lg text-gray-700 hover:text-primary"
                            onClick={() => setIsOpen(false)}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <Link to="/sign-in" className="text-lg text-gray-700 hover:text-primary">
                        <Button className="w-full mt-4">Đăng nhập</Button>
                    </Link>
                </div>
            </div>

            {/* Overlay để đóng nav */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
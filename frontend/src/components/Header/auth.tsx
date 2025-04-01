import logo from "@/assets/imgs/logo.png";
import { Link } from "react-router-dom";

export default function AuthHeader() {
  return (
    <div className="p-1 border-b-2 border-primary flex flex-wrap items-center justify-between relative">
      <Link to="/" className="flex items-center">
        <img src={logo} alt="logo" className="md:max-w-[75px] max-w-[100px] ml-10" />
        <span className="ml-2 text-xl font-bold">POWER HUB</span>
      </Link>
    </div>
  );
}

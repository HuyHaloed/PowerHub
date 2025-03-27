import logo from "@/assets/imgs/logo.png";
import { Link } from "react-router-dom";

export default function AuthHeader() {
  return (
    <div className="p-4 border-b-3 border-primary flex flex-wrap items-center justify-between relative">
      <Link to="/">
        <img src={logo} alt="logo" className="md:max-w-[300px] max-w-[150px]" />
      </Link>
    </div>
  );
}

import banner from "@/assets/imgs/banner.png";
import sub from "@/assets/imgs/sub.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="grid lg:grid-cols-2 gap-4 items-center lg:mx-7 sm:mx-5 mx-3 flex-1 mt-3">
      <div className="space-y-5">
        <div className="flex flex-col w-fit">
          <h1>
            Find a <span className="text-primary">Doctor &</span>
          </h1>
          <img src={sub} alt="placeholder" className="self-end" />
          <h2>
            Book and <span className="text-primary">Appointment</span>
          </h2>
        </div>
        <p className="italic text-secondary">
          Easily search for qualified doctors based on specialty, location,
          availability, and patient reviews. View detailed doctor profiles,
          including credentials, experience, and consultation fees.{" "}
        </p>
        <div className="mt-5 flex items-center gap-5">
          <Button variant={"secondary"}>Xem ngay</Button>
          <Link to="/about">
            <Button variant={"link"} className="text-secondary">
              Thông tin chi tiết
            </Button>
          </Link>
        </div>
      </div>
      <div>
        <img src={banner} alt="placeholder" className="w-[100%] h-[100%]" />
      </div>
    </div>
  );
}

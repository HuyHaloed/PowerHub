import logo from "@/assets/imgs/logo.png";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthHeader() {
  return (
    <motion.div 
      className=" border-b-2 border-primary flex items-center justify-between bg-white shadow-md relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Link to="/" className="flex items-center group">
        <motion.img 
          src={logo} 
          alt="logo" 
          className="md:max-w-[75px] max-w-[100px] ml-10 group-hover:scale-110 transition-transform duration-300"
          whileHover={{ scale: 1.1 }}
        />
        <motion.span 
          className="ml-2 text-xl font-bold text-gray-800 group-hover:text-primary transition-colors duration-300"
          whileHover={{ color: "#3B82F6" }}
        >
          POWER HUB
        </motion.span>
      </Link>
    </motion.div>
  );
}
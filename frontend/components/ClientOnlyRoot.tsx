"use client";

import { ToastContainer } from "react-toastify";
import NavBar from "./NavBar";
import { usePathname } from "next/navigation";
import "react-toastify/dist/ReactToastify.css";

interface Props {
  children: React.ReactNode;
}

export default function ClientOnlyRoot({ children }: Props) {
  const pathname = usePathname();
  const showNavBar = !pathname.startsWith("/admin");

  return (
    <>
      {showNavBar && <NavBar />}
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ top: "80px" }}
      />
    </>
  );
}
"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    // initial route to be login
    let token = JSON.parse(window.localStorage.getItem("Expensetracker"))?.token;
    if (token) {
      router.replace("/User/dashboard");
      //Testing code 
    } else {
      router.replace("/login");
    }
  }, []);
  return <></>;
}

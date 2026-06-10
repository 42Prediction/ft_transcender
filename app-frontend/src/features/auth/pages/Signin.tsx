import { useState } from "react";
import { AuthModal } from "../components/AuthModal";

export default function Signin() {
    const [open, setOpen] =  useState(false);
    const [authTab, setAuthTab] = useState<"signin" | "signout">("signin");
    const openChange = (tab: "signin" | "signout") => {
      setAuthTab(tab);
        setOpen(true);
    }
  return (
    <>
        <AuthModal 
          open={open}
          onOpenChange={setOpen}
          defaultTab={authTab}
        />
    </>
  );
}
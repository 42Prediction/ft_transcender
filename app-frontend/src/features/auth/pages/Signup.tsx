export default function Signup() {
    const {open, setOpen} =  useState(false);
    const [authTab, setAuthTab] = useState<"signin" | "signout">("signin");
    const openChange = (tab: "sigin" | "signout") => {
        setOpen(true);
        setAuthTab(tab);
    }
  return (
    <div >
        <AuthModal open={open} onOpenChange={setOpen} defaultTab={authTab}/>
    </div>
  );
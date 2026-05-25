import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const drownDownRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState(null)
  const [open, setOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;
  useEffect(() => {
    api.getProfile().then(setProfile);
  }, []);

  useEffect(() => {
    function handleClickOutSide(event: MouseEvent) {
      if (drownDownRef.current &&
        !drownDownRef.current.contains(event.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutSide);
    return () => {
      document.removeEventListener("mousedown", handleClickOutSide);
    }
  }, [])
  return (
    <nav className="w-full bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-center sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 group" >
        <img className="w-16 h-16" src="/iconBet_white.png" alt="" />
      </Link>
      <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
        <Link to="/" className={`transition-colors ${isActive('/') ? 'text-[#00FF9D]' : 'text-zinc-500 hover:text-white'}`}
        >
          Ranks
        </Link>
        <Link to="/leaderboard" className={`transition-colors ${isActive('/leaderboard') ? 'text-[#00FF9D]' : 'text-zinc-500 hover:text-white transition-colors'}`}>
          Leaderboard
        </Link>
        <Link to="/jogos" className="text-zinc-500 hover:text-white transition-colors" // Opaco pois ainda não existe
        >
          Jogos
        </Link>
        <div className="relative" ref={drownDownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="text-zinc-500 hover:text-white transition-colors uppercase"
          >
            {profile?.firstName}
          </button>
          {open && (
            <div className="absolute mt-3 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <Link
                to={`users/${profile?.firstName}`}
                className="flex items-center gap-1.5 text-sm capitalize p-3 text-zinc-300 hover:bg-zinc-800 transition-colors"
                onClick={() => setOpen(false)}
              >
                <FontAwesomeIcon icon={faGear} />
                Settings
              </Link>

              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className=" flex items-center gap-1.5 w-full text-sm p-3 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                Logout
              </button>

            </div>
          )}


        </div>

      </div>
    </nav>
  )
}         
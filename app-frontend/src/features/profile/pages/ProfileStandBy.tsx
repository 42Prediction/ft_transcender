import { useState } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import FriendsList from "../../../components/profile/FriendsList.tsx";
import ProfileCard from "../../../components/profile/ProfileCard.tsx";
import EditProfileModal from '../../../components/profile/EditProfileModal.tsx';

import { bettor } from "../../../api/bettor/bettor.api.ts";

interface Bettor {
  nick: string;
  bio: string;
  avatar: string;
  isNickSet: boolean;
}

export async function privateProfileLoader(): Promise<Bettor> {
  const res = await bettor.getMe();
  return res.data;
}

export async function publicProfileLoader(
  { params }: { params: { nick: string } }
): Promise<Bettor> {
  const res = await bettor.getByNick(params.nick);
  return res.data;
}

export default function Profile() {
  const { nick } = useParams<{ nick?: string }>();
  const isOwnProfile = !nick;

  const bettorData = useLoaderData() as Bettor;

  const [current, setCurrent] = useState<Bettor>(bettorData);
  const [editing, setEditing] = useState(false);

  if (!current) {
    return (
      <div className="flex h-screen bg-black items-center justify-center text-[#ff0000] italic">
        <h1 className="text-2xl font-black uppercase tracking-wider">
          USUÁRIO NÃO ENCONTRADO
        </h1>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#121212] min-h-screen text-white flex justify-center items-start">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProfileCard
          bettor={current}
          isOwnProfile={isOwnProfile}
          onEditClick={() => setEditing(true)}
        />

        <FriendsList />

        {editing && (
          <EditProfileModal
            bettorData={current}
            onClose={() => setEditing(false)}
            onSaved={(updated) => setCurrent(updated)}
          />
        )}
      </div>
    </div>
  );
}
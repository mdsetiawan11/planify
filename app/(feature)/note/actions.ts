import { IMeeting } from "@/types/app-interface";

export const fetchMeetings = async (): Promise<IMeeting[]> => {
  const res = await fetch("/api/meetings");
  const json = await res.json();
  return json as IMeeting[];
};

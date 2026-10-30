import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBrandBrain } from "./brand-brain.functions";
export function useBrandBrain(workspaceId?: string) {
  const read = useServerFn(getBrandBrain);
  return useQuery({ queryKey: ["brand-brain", workspaceId], enabled: Boolean(workspaceId), queryFn: () => { if (!workspaceId) throw new Error("مساحة العمل غير متاحة."); return read({ data: { workspaceId } }); }, refetchInterval: (query) => ["queued", "running"].includes(query.state.data?.job?.status ?? "") ? 3000 : false });
}
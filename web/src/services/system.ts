import request from "@/utils/request"

export const transferData  = async (data: any): Promise<void> => {
  return request(`/system/data/transfer`, { method: "POST", data })
}
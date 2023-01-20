import request from "@/utils/request"

export const fetchUserInfo = async (id: string = "1"): Promise<UserInfo> => {
    return request(`/user/info`, { method: "GET" })
}
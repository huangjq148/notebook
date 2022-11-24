import request from "@/utils/request"

export const createOrder = async (data: Order): Promise<void> => {
    return request(`/order`, { method: "POST", data })
}

export const queryOrder = async (conditions: Record<string, unknown>): Promise<Order[]> => {
    return request(`/order`, { method: "GET", params: conditions })
}

export const queryOrderById = async (id: string): Promise<Order> => {
    return request(`/order/${id}`, { method: "GET" })
}

export const updateOrder = async (data: Order): Promise<void> => {
    return request(`/order`, { method: "PATCH", data })
}

export const deleteOrder = async (id: string): Promise<void> => {
    return request(`/order/${id}`, { method: "DELETE" })
}
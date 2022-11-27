import request from "@/utils/request"

export const createOrder = async (data: Order): Promise<void> => {
    return request(`/order`, { method: "POST", data })
}

export const statistics = async (conditions: Record<string, unknown>): Promise<any> => {
    return request(`/order/statistics`, { method: "GET", params: conditions })
}

export const queryOrder = async (conditions: Record<string, unknown>): Promise<Order[]> => {
    return request(`/order`, { method: "GET", params: conditions })
}

export const queryOrderById = async (id: number): Promise<Order> => {
    return request(`/order/${id}`, { method: "GET" })
}

export const updateOrder = async (data: Order): Promise<void> => {
    return request(`/order`, { method: "PATCH", data })
}

export const deleteOrder = async (id: number): Promise<void> => {
    return request(`/order/${id}`, { method: "DELETE" })
}

export const changeOrderStatus = async (id: number, status: string): Promise<void> => {
    return request(`/order/${id}/status/${status}`, { method: "PATCH" })
}

export const revokeStockOrder = async (id: number): Promise<void> => {
    return request(`/order/revoke/stock/${id}`, { method: "DELETE" })
}
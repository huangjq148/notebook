import request from "@/utils/request"

export const createProduct = async (data: Product): Promise<Product> => {
    return request(`/product`, { method: "POST", data })
}

export const queryProduct = async (conditions: Record<string, unknown>): Promise<Product[]> => {
    return request(`/product`, { method: "GET", params: conditions })
}

export const queryProductById = async (id: string): Promise<Product[]> => {
    return request(`/product/${id}`, { method: "GET" })
}

export const updateProduct = async (id: string): Promise<Product[]> => {
    return request(`/product`, { method: "PATCH" })
}

export const deleteProduct = async (id: string): Promise<Product[]> => {
    return request(`/product/${id}`, { method: "DELETE" })
}
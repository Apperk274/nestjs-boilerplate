import axios, { type AxiosResponse } from "axios"
import Cookies from "universal-cookie";
import cookieKeys from "@/constants/cookie-keys";
const lang = "en"
const routeParamRegex = /^:(\w+)$/;
// Model Imports
import { 
} from "models"

function createAxiosInstance() {
    const token = new Cookies().get(cookieKeys.COOKIE_USER_TOKEN, { doNotParse: true} )
    return axios.create({ baseURL: (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000') + "/api", headers: { "Authorization": `Bearer ${token}`, "Accept-Language": lang } })
}

function createUrl(params: { [key: string]: string }, route: string) {
    let url = ""
    for (const block of route.substring(1).split("/")) {
        url += "/"
        const paramRegExpArray = block.match(routeParamRegex)
        if (paramRegExpArray == null) { url += block; continue }
        else url += params[`${Object.keys(params).find(p => p === paramRegExpArray[1])}`]
    }
    return url
}

export default {
    app: {
        async getHello(
        ) : Promise<AxiosResponse<string>>
        {
            const route = "\"
            const url = route
            return await createAxiosInstance().request({
                method: "GET",
                url,
            })
        },
    },
    cats: {
        async create(
            body: CreateCatDto,
        ) : Promise<AxiosResponse<string>>
        {
            const route = "\cats"
            const url = route
            return await createAxiosInstance().request({
                method: "POST",
                url,
                data: body,
            })
        },
        async findAll(
        ) : Promise<AxiosResponse<[
    Cat[],
    number
]>>
        {
            const route = "\cats"
            const url = route
            return await createAxiosInstance().request({
                method: "GET",
                url,
            })
        },
        async findOne(
            params: {
    id: string;
},
        ) : Promise<AxiosResponse<string>>
        {
            const route = "\cats\:id"
            const url = route
            return await createAxiosInstance().request({
                method: "GET",
                url,
            })
        },
        async update(
            body: UpdateCatDto,
            params: {
    id: string;
},
        ) : Promise<AxiosResponse<string>>
        {
            const route = "\cats\:id"
            const url = route
            return await createAxiosInstance().request({
                method: "PATCH",
                url,
                data: body,
            })
        },
        async remove(
            params: {
    id: string;
},
        ) : Promise<AxiosResponse<string>>
        {
            const route = "\cats\:id"
            const url = route
            return await createAxiosInstance().request({
                method: "DELETE",
                url,
            })
        },
    },
    
} 
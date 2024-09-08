import axios from "axios";


let staticCategories: Record<string, string>[];

export async function getCategories() {
    if (!staticCategories){
        const response = await axios.get('/api/static/categories');
        staticCategories = response.data;
    }

    return staticCategories;
}
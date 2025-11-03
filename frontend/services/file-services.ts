import api from "./api";

export const uploadImage = async (file: File) => {
    const formdata = new FormData();
    formdata.append("File", file);
    const res = await api.post("/api/files/upload", formdata, {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return res.data.imageUrl;
};
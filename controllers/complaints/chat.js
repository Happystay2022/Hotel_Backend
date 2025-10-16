import chat from "../../models/complaints/chat.js"


export const doChat = async function (req, res) {
    const { complaintId, sender, receiver, content } = req.body
    try {
        const startChat = await chat.create({
            complaintId,
            sender,
            receiver,
            content
        })
        res.status(200).json(startChat)
    } catch (err) {
        res.status(500).json(err)
    }
}

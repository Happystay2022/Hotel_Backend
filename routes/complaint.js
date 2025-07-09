const express = require("express");
const { upload } = require("../aws/upload");
const router = express.Router()
const complaintController = require('../controllers/complaint')

router.post(
  "/create-a-complaint/on/hotel",
  upload,
  complaintController.createComplaint
); //on site
router.patch(
  "/approveComplaint-on-panel/by-id/:id",
  complaintController.approveComplaint
); //on panel);
router.get("/complaints/:userId", complaintController.getComplaintsByUserId); //on site
router.delete(
  "/delete-a-particular/complaints/delete/by/id/:id",
  complaintController.deleteComplaint
); //on site
router.get(
  "/get/all-complaint-on-admin/panel",
  complaintController.getComplaint
); //on panel
router.get(
  "/get/all-complaint-on-admin/panel/by-filter",
  complaintController.filteredComplaints
); //on panel
module.exports=router
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');
const auth = require('../authentication/auth');

router.post('/reviews/:userId/:hotelId',  reviewController.createReview); // on site
router.get('/getReviews/hotelId', reviewController.getReviewsByHotelId); // on site

router.get('/reviewDatas/userId', reviewController.getReviewsByUserId); //on site
router.put('/update-your-review/:userId/:hotelId', reviewController.updateReview);
router.delete('/delete/:reviewId', reviewController.deleteReview); // on site
router.get('/find-all-users-hotel-review', reviewController.findAllReviews); // panel
module.exports = router;

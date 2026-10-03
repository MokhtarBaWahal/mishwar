import { RatingReview } from '../../packages/shared_types/src';

class RatingService {
  private reviews: RatingReview[] = [
    {
      id: 'rev_01',
      rideId: 'ride_seed_01',
      fromUserId: 'cust_01',
      toUserId: 'drv_01',
      targetRole: 'DRIVER',
      stars: 5,
      comment: 'سائق محترم جداً، القيادة هادئة وسلسة في شارع الستين',
      tags: ['سريع ومحترم', 'سيارة نظيفة'],
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
    }
  ];

  submitRating(review: Omit<RatingReview, 'id' | 'createdAt'>): RatingReview {
    const newReview: RatingReview = {
      ...review,
      id: `rev_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.reviews.unshift(newReview);
    return newReview;
  }

  getReviewsForUser(userId: string): RatingReview[] {
    return this.reviews.filter((r) => r.toUserId === userId);
  }

  calculateRating(userId: string): { average: number; count: number } {
    const userReviews = this.getReviewsForUser(userId);
    if (userReviews.length === 0) return { average: 5.0, count: 0 };

    const sum = userReviews.reduce((acc, curr) => acc + curr.stars, 0);
    return {
      average: Math.round((sum / userReviews.length) * 10) / 10,
      count: userReviews.length
    };
  }
}

export const ratingService = new RatingService();

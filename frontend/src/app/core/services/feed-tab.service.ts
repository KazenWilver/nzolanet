import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FeedTab = 'para-ti' | 'a-seguir';

@Injectable({ providedIn: 'root' })
export class FeedTabService {
  private readonly followingStaleSubject = new BehaviorSubject(false);
  readonly followingStale$ = this.followingStaleSubject.asObservable();

  markFollowingStale(): void {
    this.followingStaleSubject.next(true);
  }

  clearFollowingStale(): void {
    this.followingStaleSubject.next(false);
  }

  isFollowingStale(): boolean {
    return this.followingStaleSubject.getValue();
  }
}

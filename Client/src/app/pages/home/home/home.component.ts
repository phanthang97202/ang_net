import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DiscoveryBannerComponent } from '../../../components/discovery-banner/discovery-banner.component';
import { CategoryShowcaseComponent } from '../../../components/category-showcase/category-showcase.component';
import { FeaturedNewsComponent } from '../../../components/featured-news/featured-news.component';
import { NewNewsComponent } from '../../../components/new-news/new-news.component';
import { HomeSidebarComponent } from '../../../components/home-sidebar/home-sidebar.component';
import { HotTopicPostsComponent } from '../../../components/hot-topic-posts/hot-topic-posts.component';
import { SubscribeNotifyComponent } from '../../../components/subscribe-notify/subscribe-notify.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DiscoveryBannerComponent,
    CategoryShowcaseComponent,
    FeaturedNewsComponent,
    NewNewsComponent,
    HomeSidebarComponent,
    HotTopicPostsComponent,
    SubscribeNotifyComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(private router: Router) {}
}

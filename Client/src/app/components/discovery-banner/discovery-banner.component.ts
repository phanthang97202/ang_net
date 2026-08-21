import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../directives';
import { MusicPlayerComponent } from '../music-player/music-player.component';

@Component({
  selector: 'app-discovery-banner',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective, MusicPlayerComponent],
  templateUrl: './discovery-banner.component.html',
  styleUrls: ['./discovery-banner.component.scss'],
})
export class DiscoveryBannerComponent {}

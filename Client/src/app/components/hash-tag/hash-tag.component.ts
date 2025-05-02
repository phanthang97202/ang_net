import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-hash-tag',
  standalone: true,
  imports: [],
  templateUrl: './hash-tag.component.html',
  styleUrl: './hash-tag.component.scss',
})
export class HashTagComponent implements OnInit {
  @Input() title!: string;
  constructor() {}

  ngOnInit() {}
}

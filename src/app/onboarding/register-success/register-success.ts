import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-success',
  imports: [RouterLink],
  templateUrl: './register-success.html',
  styleUrl: './register-success.scss',
})
export class RegisterSuccess implements OnInit {
  email = '';

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }
}

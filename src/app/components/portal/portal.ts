import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminAuth } from '../../services/admin-auth/admin-auth';

@Component({
  imports: [RouterLink],
  selector: 'app-portal',
  styleUrl: './portal.css',
  templateUrl: './portal.html',
})
export class Portal {
  constructor(private auth: AdminAuth, private router: Router) {}

  sair(): void {
    this.auth.sair();
    this.router.navigate(['/home']);
  }
}

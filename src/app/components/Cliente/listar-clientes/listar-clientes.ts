
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ClienteService } from '../../../services/cliente/cliente-service';
import { Pessoas } from '../../../models/pessoas/pessoa';

@Component({
  selector: 'app-listar-clientes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listar-clientes.html',
  styleUrl: './listar-clientes.css'
})
export class ListarClientes implements OnInit {

  // O Angular 22 não usa zone.js: para a tela atualizar depois da resposta
  // da API, o estado precisa ficar em signals.
  clientes = signal<Pessoas[]>([]);
  carregando = signal(false);
  erro = signal('');

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.listarClientes();
  }

  // Busca novamente os clientes na API
  listarClientes(): void {
    if (this.carregando()) {
      return;
    }

    this.carregando.set(true);
    this.erro.set('');

    this.clienteService.listarClientes()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (dados: any[]) => {
          this.clientes.set(
            (dados ?? []).map((item: any) => {
              const cliente = new Pessoas();

              cliente.id = item.idPessoa ?? item.id ?? item.IdPessoa;
              cliente.nome = item.nome;
              cliente.CPF = item.cpf ?? item.CPF;
              cliente.datanascimento = item.dataNascimento ?? item.datanascimento;
              cliente.sexo = item.sexo;
              cliente.email = item.email;
              cliente.telefone = item.telefone;
              cliente.AtivoPessoa = item.ativoPessoa ?? item.AtivoPessoa;
              cliente.Enderecos = item.enderecos ?? item.Enderecos ?? [];

              return cliente;
            })
          );
        },

        error: (erro) => {
          console.error('Erro ao listar clientes:', erro);
          this.erro.set('Não foi possível carregar os clientes.');
        }
      });
  }

  // Exclui o cliente e atualiza a lista
  excluirCliente(id: number): void {
    const confirmado = confirm(
      'Deseja realmente excluir este cliente?'
    );

    if (!confirmado) {
      return;
    }

    this.erro.set('');

    this.clienteService.excluirCliente(id).subscribe({
      next: () => {
        // Atualiza a tela consultando novamente a API
        this.listarClientes();
      },

      error: (erro) => {
        console.error('Erro ao excluir cliente:', erro);
        this.erro.set('Não foi possível excluir o cliente.');
      }
    });
  }
}

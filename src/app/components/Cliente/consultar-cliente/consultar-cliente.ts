
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PessoaService } from '../../../services/pessoa/pessoa-service';

@Component({
  selector: 'app-consultar-cliente',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './consultar-cliente.html',
  styleUrl: './consultar-cliente.css'
})
export class ConsultarCliente implements OnInit {
  pessoa = signal<any>(null);
  carregando = signal(true);
  erro = signal('');

  constructor(
    private pessoaService: PessoaService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || Number.isNaN(id)) {
      this.erro.set('ID da pessoa inválido.');
      this.carregando.set(false);
      return;
    }

    this.pessoaService.listarPessoa(id).subscribe({
      next: (resposta: any) => {
        // A API devolve uma lista com 1 item; pega o primeiro
        const dados = Array.isArray(resposta) ? resposta[0] : resposta;

        if (!dados) {
          this.erro.set('Pessoa não encontrada.');
          this.carregando.set(false);
          return;
        }

        this.pessoa.set({
          id: dados.idPessoa ?? dados.id ?? id,
          nome: dados.nome,
          CPF: dados.cpf ?? dados.CPF,
          datanascimento: dados.dataNascimento ?? dados.datanascimento,
          sexo: dados.sexo,
          email: dados.email,
          telefone: dados.telefone,
          AtivoPessoa: dados.ativoPessoa ?? dados.AtivoPessoa,
          Enderecos: dados.enderecos ?? dados.Enderecos ?? []
        });

        this.carregando.set(false);
      },
      error: (erro) => {
        console.error('Erro ao consultar pessoa:', erro);
        this.erro.set('Não foi possível consultar esta pessoa.');
        this.carregando.set(false);
      }
    });
  }
}

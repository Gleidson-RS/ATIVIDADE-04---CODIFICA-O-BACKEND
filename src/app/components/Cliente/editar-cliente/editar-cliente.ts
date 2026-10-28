
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PessoaService } from '../../../services/pessoa/pessoa-service';

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './editar-cliente.html',
  styleUrl: './editar-cliente.css'
})
export class EditarCliente implements OnInit {
  // Campos do formulário (ngModel). Tudo como string: inputs de texto
  // preservam zero à esquerda do CPF/telefone e a API aceita string.
  id = 0;
  nome = '';
  CPF = '';
  datanascimento = '';
  sexo = '';
  email = '';
  telefone = '';
  AtivoPessoa = 'S';

  CEP = '';
  Numero = '';
  Complemento = '';

  // Endereço original vindo da API (mantém o id do endereço no PUT)
  private enderecoOriginal: any = null;

  // Sem zone.js, o que a tela exibe depois da API precisa ser signal.
  carregando = signal(true);
  salvando = signal(false);
  erro = signal('');

  constructor(
    private pessoaService: PessoaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || Number.isNaN(id)) {
      this.erro.set('ID da pessoa inválido.');
      this.carregando.set(false);
      return;
    }

    this.id = id;

    this.pessoaService.listarPessoa(id).subscribe({
      next: (resposta: any) => {
        // A API devolve uma lista com 1 item; pega o primeiro
        const dados = Array.isArray(resposta) ? resposta[0] : resposta;

        if (!dados) {
          this.erro.set('Pessoa não encontrada.');
          this.carregando.set(false);
          return;
        }

        this.nome = dados.nome ?? '';
        this.CPF = String(dados.cpf ?? dados.CPF ?? '');
        // <input type="date"> só aceita yyyy-MM-dd; a API manda "2000-01-31T00:00:00"
        this.datanascimento = String(
          dados.dataNascimento ?? dados.datanascimento ?? ''
        ).substring(0, 10);
        this.sexo = dados.sexo ?? '';
        this.email = dados.email ?? '';
        this.telefone = String(dados.telefone ?? '');
        this.AtivoPessoa = dados.ativoPessoa ?? dados.AtivoPessoa ?? 'S';

        const endereco = (dados.enderecos ?? dados.Enderecos ?? [])[0];
        this.enderecoOriginal = endereco ?? null;

        this.CEP = endereco?.cep ?? endereco?.CEP ?? '';
        this.Numero = String(endereco?.numero ?? '');
        this.Complemento = endereco?.complemento ?? '';

        this.carregando.set(false);
      },
      error: (erro) => {
        console.error('Erro ao carregar pessoa:', erro);
        this.erro.set('Não foi possível carregar os dados da pessoa.');
        this.carregando.set(false);
      }
    });
  }

  salvar(): void {
    if (this.salvando()) return;

    this.salvando.set(true);
    this.erro.set('');

    // Reaproveita o endereço original (com o id dele) e troca só os campos editados
    const endereco: any = { ...(this.enderecoOriginal ?? {}) };
    delete endereco.cep;
    endereco.CEP = this.CEP.replace(/\D/g, ''); // a coluna cep tem 8 caracteres
    endereco.numero = String(this.Numero);
    endereco.complemento = this.Complemento;

    const payload = {
      id: this.id,
      idPessoa: this.id,
      nome: this.nome,
      CPF: this.CPF,
      datanascimento: this.datanascimento,
      sexo: this.sexo,
      email: this.email,
      telefone: this.telefone,
      AtivoPessoa: this.AtivoPessoa,
      Enderecos: [endereco]
    };

    this.pessoaService.alterarPessoa(this.id, payload)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          alert('Pessoa alterada com sucesso!');
          this.router.navigate(['/listar-clientes']);
        },
        error: (erro) => {
          console.error('Erro ao editar pessoa:', erro);
          console.error('Detalhes da API:', erro.error);
          this.erro.set('Não foi possível salvar as alterações.');
        }
      });
  }
}

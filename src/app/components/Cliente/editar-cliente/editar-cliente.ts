
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PessoaService } from '../../../services/pessoa/pessoa-service';
import { somenteDigitos, validarCliente } from '../../../shared/validadores';
import { mensagemErroApi } from '../../../shared/erro-api';

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
  tocados = signal<Record<string, boolean>>({});
  readonly hoje = new Date().toISOString().substring(0, 10);

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

  // Mensagem de erro do campo (só aparece depois que o usuário interagiu com ele).
  erroCampo(campo: string): string {
    if (!this.tocados()[campo]) return '';
    return validarCliente(this)[campo] ?? '';
  }

  tocar(campo: string): void {
    this.tocados.update(t => ({ ...t, [campo]: true }));
  }

  salvar(): void {
    if (this.salvando()) return;

    this.erro.set('');
    const erros = validarCliente(this);

    if (Object.keys(erros).length > 0) {
      const todos: Record<string, boolean> = {};
      Object.keys(erros).forEach(c => (todos[c] = true));
      this.tocados.update(t => ({ ...t, ...todos }));
      this.erro.set('Corrija os campos destacados antes de salvar.');
      return;
    }

    this.salvando.set(true);

    // Reaproveita o endereço original (com o id dele) e troca só os campos editados
    const endereco: any = { ...(this.enderecoOriginal ?? {}) };
    delete endereco.cep;
    endereco.CEP = somenteDigitos(this.CEP); // a coluna cep tem 8 caracteres
    endereco.numero = String(this.Numero);
    endereco.complemento = this.Complemento;

    const payload = {
      id: this.id,
      idPessoa: this.id,
      nome: this.nome,
      CPF: somenteDigitos(this.CPF),
      datanascimento: this.datanascimento,
      sexo: this.sexo,
      email: this.email,
      telefone: somenteDigitos(this.telefone),
      AtivoPessoa: this.AtivoPessoa,
      Enderecos: [endereco]
    };

    this.pessoaService.alterarPessoa(this.id, payload)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/listar-clientes'], {
            state: { mensagem: 'Cliente alterado com sucesso!' }
          });
        },
        error: (erro) => {
          console.error('Erro ao editar pessoa:', erro);
          console.error('Detalhes da API:', erro.error);
          this.erro.set(mensagemErroApi(erro, 'salvar as alterações'));
        }
      });
  }
}

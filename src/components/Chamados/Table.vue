<!--
  TODO
  Toda vez que acessar um chamado que o status é fechado ou fechado pelo solicitante, fazer a busca da avaliação no 
  topdesk e atualizar no DB, também criar janela para mostrar esses campos de avaliação.. 

  criar a alteração do telefone/ramal do v-card do chamado

  criar demonstração na tabela expandida(principal) se aquele chamado tem ticket ou gmud

  Criar props da função notification

-->

<template >

  <div class="container d-flex justify-content-start ml-1">
    <div 
    :class="{'tableSize': tableWidht,
              'tableSizeSmall': !tableWidht}"
    >
      <!-- table of chamados -->
      <v-card class="px-4">
        <v-card-title class="pt-2 px-0 pb-2">
            <div class="container d-flex">
              <h4>Meus Chamados</h4> 
              <v-spacer></v-spacer>
             <div v-if="tableWidht">
               <input type="text" id="input_syncTopdesk" v-model="input_syncTopdesk">
                <button 
                  @click.prevent.stop="syncDataTopDesk"
                  class="btn-sm btn-primary ml-4" 
                ><i v-if="LoadSyncTopDesk" class="fas fa-sync fa-spin"></i> Sincronizar TopDesk </button>
             </div>
            </div>
            <div v-if="initialLoad">
              <i class="fas fa-sync fa-spin"> </i>
              <span> Carregando lista ... </span>
            </div>
        </v-card-title>
        <table class="table table-sm table-hover table-dark table-striped" id="tableTickets" >
          <thead>
            <tr>
              <th class="no-sort"><i class="material-icons th_folder">create_new_folder</i></th>
              <th class="th1">Nº Chamado</th>
              <th class="th2 no-sort">Solicitante</th>
              <th v-show="tableExpanded" class="th3">Últ. Retorno</th>
              <th v-show="tableExpanded" class="th4">Status</th>
              <th v-show="tableExpanded" class="th5">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(chamado) in chamados" :id="chamado.id" v-bind:key="chamado.num_chamado" :class="{'info': chamado.num_chamado == chamadoMoreInfo}" style="cursor: pointer">
              <td>
                <v-icon  @click.prevent.stop="createFolderCopyPath(chamado.num_chamado)" color="yellow darken-2">folder</v-icon>
              </td>
              
              <template v-if="tableExpanded">
                <!-- essa td tem o @click diferente da debaixo, por isso nao pode ficar fora do template -->
                <td @click.stop="tableExpand(chamado.num_chamado)" colspan="2" >
                  <div class="d-flex pt-1 heightLineSmallTable">
                    <div class="td1">
                      <a
                        @click.stop="goToLink(chamado.link_chamado)"
                        target="_blank"
                      >{{ chamado.num_chamado }}</a> 
                    </div> 
                    <div class="td2" style="cursor: pointer;"
                      :style="chamado.num_chamado.trim().length == 14 ? 'margin-left: -27px;' : 'margin-left: -10px;'"
                    >{{ chamado.p_full_name !== null ? chamado.p_full_name.split("-")[0] : chamado.p_full_name }}</div>
                  </div>    
                  <div class="descricaoSmallTable" :class="{'descricaoSmallTableSelected': chamado.num_chamado == chamadoMoreInfo}">{{ chamado.titulo }} </div>
                </td>
                <td style="display: none;"></td>
                <td @click.stop="tableExpand(chamado.num_chamado)" class="td3">{{ chamado.f_dt_ult_retorno }}</td>
                <td class="td4">
                  <button 
                    v-if="chamado.num_chamado.trim().length !== 14"
                    @click="saveModalStatusId(chamado.num_chamado, chamado.titulo, chamado.id_chamado)"
                    type="button"
                    class="status_button"
                    href
                    data-toggle="modal"
                    data-target="#modalChangeStatus"
                    :class="status_class(chamado.status)"
                  >                  
                  {{ chamado.status }}
                  </button>
                  <!-- button abaixo criado para nao alterar status de incidente parcial no
                  topdesk, pois ele da problema e retira alguns dados -->
                  <button 
                    v-if="chamado.num_chamado.trim().length == 14"
                    type="button"
                    class="status_button"
                    href
                    :class="status_class(chamado.status)"
                  >                  
                  {{ chamado.status }}
                  </button>
                  <v-icon v-if="chamado.status == 'Em aberto' || 
                                chamado.status == 'Aguardando solicitante'" 
                    class="rotate-330 material-icons"
                    :class="icon_class(chamado.status)"  
                  >send
                  </v-icon>
                </td>
                <td 
                class="td5"
                @click.stop="tableExpand(chamado.num_chamado)"
                >
                  <span v-if="chamado.fornecedor">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                      width="24" height="24"
                      viewBox="0 0 172 172"
                      style=" fill:#000000;">
                      <g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" 
                      stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" 
                      font-family="none" font-weight="none" font-size="none" text-anchor="none" 
                      style="mix-blend-mode: normal"><path d="M0,172v-172h172v172z" fill="none">
                      </path><g fill="#ffffff">
                      <path d="M86,14.33333c-39.49552,0 -71.66667,32.17115 -71.66667,71.66667c0,39.49552 32.17115,71.66667 71.66667,71.66667c39.49552,0 71.66667,-32.17115 71.66667,-71.66667c0,-39.49552 -32.17115,-71.66667 -71.66667,-71.66667zM86,28.66667c31.74921,0 57.33333,25.58412 57.33333,57.33333c0,31.74921 -25.58412,57.33333 -57.33333,57.33333c-31.74921,0 -57.33333,-25.58412 -57.33333,-57.33333c0,-31.74921 25.58412,-57.33333 57.33333,-57.33333zM62.65234,57.33333v9.57422h17.31478v47.75911h11.81381v-47.75911h17.56673v-9.57422z">
                      </path></g></g></svg>
                  </span>
                  <span v-if="chamado.gmud">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                      width="24" height="24"
                      viewBox="0 0 172 172"
                      style=" fill:#000000;">
                      <g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" 
                      stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" 
                      font-family="none" font-weight="none" font-size="none" text-anchor="none" 
                      style="mix-blend-mode: normal"><path d="M0,172v-172h172v172z" fill="none">
                      </path><g fill="#ffffff">
                      <path d="M86,14.33333c-39.49552,0 -71.66667,32.17115 -71.66667,71.66667c0,39.49552 32.17115,71.66667 71.66667,71.66667c39.49552,0 71.66667,-32.17115 71.66667,-71.66667c0,-39.49552 -32.17115,-71.66667 -71.66667,-71.66667zM86,28.66667c31.74921,0 57.33333,25.58412 57.33333,57.33333c0,31.74921 -25.58412,57.33333 -57.33333,57.33333c-31.74921,0 -57.33333,-25.58412 -57.33333,-57.33333c0,-31.74921 25.58412,-57.33333 57.33333,-57.33333zM55.83561,57.33333v57.33333h11.8138v-15.67708l-1.18978,-27.00098l15.43912,42.67806h8.11849l15.48112,-42.73405l-1.18977,27.05697v15.67708h11.85579v-57.33333h-15.50911l-14.65527,41.58626l-14.72526,-41.58626z">
                      </path></g></g></svg>
                  </span>
                </td>
              </template>
              
              <template v-if="!tableExpanded">
                <td colspan="2" @click.stop="getNewChamado(chamado.num_chamado)">
                  <div class="d-flex pt-1 heightLineSmallTable">
                    <div class="td1">
                      <a
                        @click.stop="goToLink(chamado.link_chamado)"
                        target="_blank"
                      >{{ chamado.num_chamado }}</a> 
                    </div> 
                    <div class="td2" style="cursor: pointer;"
                      :style="chamado.num_chamado.trim().length == 14 ? 'margin-left: -27px;' : 'margin-left: -10px;'"
                    >{{ chamado.p_full_name !== null ? chamado.p_full_name.split("-")[0] : chamado.p_full_name }}</div>
                  </div>    
                  <div class="descricaoSmallTable" :class="{'descricaoSmallTableSelected': chamado.num_chamado == chamadoMoreInfo}">{{ chamado.titulo }} </div>
                </td>
                <td style="display: none;"></td>
                <td style="display: none;"></td>
                <td style="display: none;"></td>
              </template>
            </tr>
          </tbody>
                 
        </table>
      </v-card>
      <!-- table of chamados -->
      
      <!-- Modal to change status -->
      <div 
        class="modal fade textColorModal"
        id="modalChangeStatus"
        tabindex="-1"
        role="dialog"
        aria-labelledby="modalChangeStatusTitle"
        aria-hidden="true"
        >
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="modalStatusLongTitle">{{ dataChamadoNumber }} - {{dataTitulo}} </h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                
                <label for="optionStatus">Novo Status:</label>
                <select class="form-control form-control-sm" id="selectedOptionStatus">
                  <option selected>Selecione um status...</option>
                  <option v-if="dataChamadoNumber.trim().length !== 10">Aguardando especialista</option>
                  <option>Aguardando fornecedor</option>
                  <option>Aguardando solicitante</option>
                  <option v-if="dataChamadoNumber.trim().length !== 10">Em aberto</option>
                  <option v-if="dataChamadoNumber.trim().length !== 10">Em andamento</option>
                  <option v-if="dataChamadoNumber.trim().length == 10">Iniciada</option>
                  <option>Pausado</option>
                  <option>Resolvido</option>
                </select>

              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" @click="updateStatusServer()">
                <i v-if="LoadUpdateStatus" class="fas fa-sync fa-spin"></i>
                Salvar Status
            </button>
            </div>
          </div>
        </div>
      </div>
      <!-- End Modal to change status -->

    </div>

    <!-- More informations -->
    <template v-if="!tableExpanded">
      <div v-for="(chamado) in chamadoSelected" v-bind:key="chamado.num_chamado"  
        class="moreInfos" >
        <!-- Chamado Data More info -->
        <v-card class="mb-1">
          <button type="button" class="close mr-1" data-dismiss="modal" aria-label="Close" @click.prevent.stop="tableExpand()">
            <span aria-hidden="true">&times;</span>
          </button>
          <v-card-title>
            <h6 style="font-weight: bold"> 
              <a
                @click.stop="goToLink(chamado.link_chamado)"
                target="_blank"
              >{{chamado.num_chamado}}</a> - {{chamado.titulo}} </h6>
          </v-card-title>
          <hr class="m-0 mt-1">
          <div class="container">

            <div class="form-row" >
              <div class="col-2">
                <label>Dt. Abertura:</label>
              </div>
              <div class="col-4">
                <input disabled class="fields_moreInfo width_moreInfo" :value="chamado.f_dt_abertura">
              </div>

                <div class="col-2 pr-3" style="text-align: right">
                <label>Status:</label>
              </div>
              <div class="col-4">
                  <button 
                  v-if="chamado.num_chamado.trim().length !== 14"
                    @click="saveModalStatusId(chamado.num_chamado, chamado.titulo, chamado.id_chamado)"
                    type="button"
                    class="fields_moreInfo width_moreInfo"
                    style="text-align: left"
                    href
                    data-toggle="modal"
                    data-target="#modalChangeStatus"
                    :class="status_class(chamado.status)"
                  >                  
                  {{ chamado.status }}
                  </button>
                  <!-- button abaixo criado para nao alterar status de incidente parcial no
                  topdesk, pois ele da problema e retira alguns dados -->
                  <button 
                    v-if="chamado.num_chamado.trim().length == 14"
                    type="button"
                    class="fields_moreInfo width_moreInfo"
                    href
                    :class="status_class(chamado.status)"
                  >                  
                  {{ chamado.status }}
                  </button>
              </div>
            </div>
            <div class="form-row">
              <div class="col-2">
                <label>Categoria:</label>
              </div>
              <div class="col-4" >
                <input disabled class="fields_moreInfo width_moreInfo" :value="chamado.categoria">
              </div>
              <div class="col-2" v-if="chamado.status == 'Fechado' || chamado.status == 'Fechado pelo solicitante'">
                <label>Dt. Finalização:</label>
              </div>
              <div class="col-4" v-if="chamado.status == 'Fechado' || chamado.status == 'Fechado pelo solicitante'">
                <input disabled class="fields_moreInfo width_moreInfo" :value="chamado.f_dt_encerramento">
              </div>
              <div class="col-2" v-if="chamado.status !== 'Fechado' && chamado.status !== 'Fechado pelo solicitante'">
                <label>Dt.Ult.Retorno:</label>
              </div>
              <div class="col-4" v-if="chamado.status !== 'Fechado' && chamado.status !== 'Fechado pelo solicitante'">
                <input disabled class="fields_moreInfo width_moreInfo" :value="chamado.f_dt_ult_retorno">
              </div>
            </div>
            <div class="form-row">
              <div class="col-2">
                <label>Solicitante:</label>
              </div>
              <div class="col-7">
                <input 
                  disabled class="fields_moreInfo width_moreInfo" 
                  :value="chamado.p_full_name !== null && chamado.p_full_name !== '' ? chamado.p_full_name.trim() : ''">
              </div>
              <div class="col-1">
                <label>Ramal:</label>
              </div>
              <div class="col-2">
                <input 
                    disabled 
                    class="fields_moreInfo width_moreInfo" 
                    :value="chamado.p_phone !== null && chamado.p_phone !== '' ? chamado.p_phone.trim() : ''">
              </div>
            </div>
            <div class="form-row">
              <div class="col-2">
                <label>Solicitação:</label>
              </div>
              <div class="col-10">
                <textarea 
                disabled 
                class="width_moreInfo textAreaMoreInfo form-control" 
                rows="5" 
                :value="chamado.texto_abertura"
                >
                </textarea>
              </div>
            </div>
            
          </div>
        </v-card>
        <!-- Fim Chamado Data More info -->

       <!-- Dados Fornecedor -->
        <v-card class="mb-1">
          <v-card-title>
            <span class="titleFornecedorGmud">FORNECEDOR</span>
          </v-card-title>
          <div class="col-12 pt-0">
            <ul class="nav nav-tabs card-header-tabs" id="myFornecedorTab" role="tablist">
              <!-- ABA Totvs -->
              <li v-if="aba_fornecedor(1)"
                class="nav-item">
                <a class="nav-link"
                  :id="`1-tab-fornecedor-totvs`" data-toggle="tab" :href="`#1-fornecedor-totvs`" 
                  role="tab" :aria-controls="`1-fornecedor-totvs`" aria-selected="false"
                >
                  <span>TOTVS</span>
                </a>
              </li>
              <!-- ABA Unimed do Brasil -->
              <li v-if="aba_fornecedor(2)"
                class="nav-item">
                <a class="nav-link"
                  :id="`2-tab-fornecedor-uBrasil`" 
                  data-toggle="tab" :href="`#2-fornecedor-uBrasil`" 
                  role="tab" :aria-controls="`2-fornecedor-uBrasil`" 
                  aria-selected="false"
                >
                  <span>U.BRASIL</span>
                </a>
              </li>
              <!-- ABA Plusoft -->
              <li v-if="aba_fornecedor(3)"
                class="nav-item">
                <a class="nav-link"
                  :id="`3-tab-fornecedor-plusoft`" 
                  data-toggle="tab" :href="`#3-fornecedor-plusoft`" 
                  role="tab" :aria-controls="`3-fornecedor-plusoft`" 
                  aria-selected="false"
                >
                  <span>PLUSOFT</span>
                </a>
              </li>
              <!-- ABA Projuris -->
              <li v-if="aba_fornecedor(4)"
                class="nav-item">
                <a class="nav-link"
                  :id="`4-tab-fornecedor-projuris`" 
                  data-toggle="tab" :href="`#4-fornecedor-projuris`" 
                  role="tab" :aria-controls="`4-fornecedor-projuris`" 
                  aria-selected="false"
                >
                  <span>PROJURIS</span>
                </a>
              </li>
              <!-- ABA Nekit -->
              <li v-if="aba_fornecedor(5)"
                class="nav-item">
                <a class="nav-link"
                  :id="`5-tab-fornecedor-nekit`" 
                  data-toggle="tab" :href="`#5-fornecedor-nekit`" 
                  role="tab" :aria-controls="`5-fornecedor-nekit`" 
                  aria-selected="false"
                >
                  <span>NEKIT</span>
                </a>
              </li>
              <!-- ABA Penso -->
              <li v-if="aba_fornecedor(6)"
                class="nav-item">
                <a class="nav-link"
                  :id="`6-tab-fornecedor-penso`" 
                  data-toggle="tab" :href="`#6-fornecedor-penso`" 
                  role="tab" :aria-controls="`6-fornecedor-penso`" 
                  aria-selected="false"
                >
                  <span>PENSO</span>
                </a>
              </li>
              <!-- ABA Inclui novo Ticket -->
              <li class="nav-item">
                <a class="nav-link active show"
                  id="0-tab-fornecedor" data-toggle="tab" href="#0-fornecedor" role="tab" 
                  @click="cleanFieldsFornecedor" aria-controls="0-fornecedor" aria-selected="false"
                >
                  <i class="material-icons addTotvsGmudIcon">add_circle_outline</i>
                </a>
              </li>
            </ul>

            <!-- body -->
            <div class="card tab-card fornecedor">
              <div class="tab-content">
                <!-- TAB 1 - TOTVS -->
                <div
                  class="tab-pane fade p-0" 
                  id="1-fornecedor-totvs" role="tabpanel" :aria-labelledby="`1-tab-fornecedor-totvs`"
                > 
                  <ul class="nav nav-tabs card-header-tabs" role="tablist">
                    <li v-for="(totvs, index) in totvsChamadoSelected" v-bind:key="`li-${index}-${totvs.num_ticket}`" 
                      class="nav-item">
                      <a 
                        @click="alteraAba(index, totvs.status.trim(), 'totvs')"
                        class="nav-link" 
                        :class="{'active show': index == 0 && chamado.fornecedor}"                        
                        :id="`${index}-tab-${totvs.num_ticket}`" data-toggle="tab" :href="`#${index}-${totvs.num_ticket}`" role="tab" 
                        :aria-controls="`${index}-${totvs.num_ticket}`" aria-selected="true"
                      >
                        {{totvs.num_ticket}}
                      </a>
                    </li>
                  </ul>

                  <div class="card tab-card">
                    <div class="tab-content">
                      <div 
                        v-for="(totvs, index) in totvsChamadoSelected" v-bind:key="`li-${index}-${totvs.num_ticket}`" 
                        :class="{'active show': index == 0 && chamado.fornecedor}"
                        class="tab-pane fade p-3 pt-2" :id="`${index}-${totvs.num_ticket}`" 
                        role="tabpanel" :aria-labelledby="`${index}-tab-${totvs.num_ticket}`"
                      >
                        <!-- cabeçalho do body -->
                        <div class="form-row">
                          <div class="col-10 pt-1">
                            <h6 class="card-title titleFornecedorGmudBody">
                              <a @click="goToLink(`${totvs.link_ticket !== '' 
                                                  && totvs.link_ticket !== null 
                                                  && totvs.link_ticket !== undefined ? 
                                                  totvs.link_ticket.trim() + `/` + totvs.num_ticket.trim() :
                                                  totvs.link_open_ticket.trim()}`)"
                              >{{totvs.num_ticket}}</a>  - {{totvs.titulo}}</h6> 
                          </div>
                          <div class="col-2 pt-0" style="text-align: right;">
                            <button 
                              v-if="totvs.status.trim() !== 'Fechado'"
                              @click="deleteTicket(totvs.num_chamado.trim(),totvs.num_ticket.trim(),totvs.id_fornecedor.trim())"
                              class="btn-sm btn-danger " 
                            >
                            <i v-if="LoadIncluiExcluiTicket" class="fas fa-sync fa-spin"></i>
                            Excluir</button>
                          </div>
                        </div>
                        <hr class="p-0 mb-1">
                        <!-- Conteúdo do body -->
                        
                        <div class="form-row">
                          <div class="col-2">
                            <label class="card-text">Dt. Abertura:</label>
                          </div>
                          <div class="col-4">
                            <input disabled class="fields_moreInfo width_moreInfo" :value="totvs.f_dt_abertura.trim()">
                          </div>
                          <div class="col-1">
                            <label>Status:</label>
                          </div>
                          <div class="col-4">
                            <select :id="`status-totvs${index}`" 
                              v-on:change="statusChange(totvs.status.trim(),index,'totvs')"
                              :disabled="totvs.f_dt_encerramento !== null ? true : false"
                              class="fields_moreInfo width_moreInfo"
                              :class="status_class_fornecedor(totvs.status, totvs.id_fornecedor)">
                              <option :selected="totvs.status.trim() === 'Pendente fesp'" value="fesp">Pendente fesp</option>
                              <option :selected="totvs.status.trim() === 'Pendente totvs'" value="totvs">Pendente totvs</option>
                              <option :selected="totvs.status.trim() === 'Fechado'" value="fechado">Fechado</option>
                            </select>
                          </div>
                          <div class="col-1" style="margin-top: -4px;"> <!-- icons -->
                            <i class="material-icons "
                              v-if="totvs_status_change_icon" 
                              @click.stop.prevent="alteraStatus(index, chamado.num_chamado, 
                                                                totvs.num_ticket, 'totvs')" 
                              style="cursor: pointer;">
                              save
                            </i>
                            <i v-if="loadChangeStatusFornecedor" class="fas fa-sync fa-spin"></i>
                          </div>
                        </div>
                        <div class="form-row" v-if="totvs.status.trim() == 'Fechado' || totvs_status_fechado == true">
                          <div class="col-2">
                            <label class="card-text">Fechado em:</label>
                          </div>
                          <div class="col-4">
                            <input :type="totvs.status.trim() === 'Fechado' ? 'text' : 'date'" 
                              :id="`dt-fechado-totvs${index}`"
                              :value="totvs.status.trim() === 'Fechado' ? totvs.f_dt_encerramento.trim(): todayDate"
                              :disabled="totvs.status.trim() === 'Fechado'"
                              class="fields_moreInfo width_moreInfo" >
                          </div>
                          <div class="col-2">
                            <label>Versão Futura:</label>
                          </div>
                          <div class="col-4">
                            <input 
                              :id="`versao-futura-totvs${index}`"
                              :disabled="totvs.status.trim() === 'Fechado'"
                              class="fields_moreInfo width_moreInfo" 
                              :value="totvs.versao_futura !== null && totvs.versao_futura !== '' ? totvs.versao_futura.trim() : ''">
                          </div>
                        </div>
                      
                      </div>
                    </div>
                  </div>
                </div>
                <!-- FIM 1 - TAB TOTVS -->

                <!-- TAB 2 - UNIMED DO BRASIL -->
                <div
                  class="tab-pane fade p-0" 
                  id="2-fornecedor-uBrasil" role="tabpanel" :aria-labelledby="`2-tab-fornecedor-uBrasil`"
                > 
                  <ul class="nav nav-tabs card-header-tabs" role="tablist" >
                    <li v-for="(uBrasil, index) in uBrasilChamadoSelected" v-bind:key="`li-${index}-${uBrasil.num_ticket}`" 
                      class="nav-item" >
                      <a 
                        @click="alteraAba(index, uBrasil.status.trim(), 'uBrasil')"
                        class="nav-link" :class="{'active show': index == 0 && chamado.fornecedor}" 
                        :id="`${index}-tab-${uBrasil.num_ticket}`" data-toggle="tab" :href="`#${index}-${uBrasil.num_ticket}`" role="tab" 
                        :aria-controls="`${index}-${uBrasil.num_ticket}`" aria-selected="true"
                      >
                        {{uBrasil.num_ticket}}
                      </a>
                    </li>
                  </ul>

                  <div class="card tab-card">
                    <div class="tab-content">
                      <div 
                        v-for="(uBrasil, index) in uBrasilChamadoSelected" v-bind:key="`li-${index}-${uBrasil.num_ticket}`" 
                        :class="{'active show': index == 0 && chamado.fornecedor}"
                        class="tab-pane fade p-3 pt-2" :id="`${index}-${uBrasil.num_ticket}`" 
                        role="tabpanel" :aria-labelledby="`${index}-tab-${uBrasil.num_ticket}`"
                      >
                        <!-- cabeçalho do body -->
                        <div class="form-row">
                          <div class="col-10 pt-1">
                            <h6 class="card-title titleFornecedorGmudBody">
                              <a @click="goToLink(`${uBrasil.link_ticket !== '' 
                                                  && uBrasil.link_ticket !== null 
                                                  && uBrasil.link_ticket !== undefined ? 
                                                  uBrasil.link_ticket.trim() + `/` + uBrasil.num_ticket.trim() :
                                                  uBrasil.link_open_ticket.trim()}`)"
                              >{{uBrasil.num_ticket}}</a>  - {{uBrasil.titulo}}</h6> 
                          </div>
                          <div class="col-2 pt-0" style="text-align: right;">
                            <button
                              v-if="uBrasil.status.trim() !== 'Fechado'"
                              @click="deleteTicket(uBrasil.num_chamado.trim(),uBrasil.num_ticket.trim(),uBrasil.id_fornecedor.trim())" 
                              class="btn-sm btn-danger ml-5" 
                            >
                            <i v-if="LoadIncluiExcluiTicket" class="fas fa-sync fa-spin"></i>
                            Excluir</button>
                          </div>
                        </div>
                        <hr class="p-0 mb-1">
                        <!-- Conteúdo do body -->
                        
                        <div class="form-row">
                          <div class="col-2">
                            <label class="card-text">Dt. Abertura:</label>
                          </div>
                          <div class="col-4">
                            <input disabled class="fields_moreInfo width_moreInfo" :value="uBrasil.f_dt_abertura.trim()">
                          </div>
                          <div class="col-1">
                            <label>Status:</label>
                          </div>
                          <div class="col-4">
                            <select :id="`status-uBrasil${index}`" 
                              v-on:change="statusChange(uBrasil.status.trim(),index,'uBrasil')"
                              :disabled="uBrasil.f_dt_encerramento !== null ? true : false"
                              class="fields_moreInfo width_moreInfo"
                              :class="status_class_fornecedor(uBrasil.status, uBrasil.id_fornecedor)">
                              <option :selected="uBrasil.status.trim() === 'Pendente fesp'" value="fesp">Pendente fesp</option>
                              <option :selected="uBrasil.status.trim() === 'Pendente uBrasil'" value="uBrasil">Pendente uBrasil</option>
                              <option :selected="uBrasil.status.trim() === 'Fechado'" value="fechado">Fechado</option>
                            </select>
                          </div>
                          <div class="col-1" style="margin-top: -4px;"> <!-- icons -->
                            <i class="material-icons" 
                              v-if="uBrasil_status_change_icon" 
                              @click.stop.prevent="alteraStatus(index, chamado.num_chamado, 
                                                                uBrasil.num_ticket, 'uBrasil')" 
                              style="cursor: pointer">
                              save
                            </i>
                            <i v-if="loadChangeStatusFornecedor" class="fas fa-sync fa-spin"></i>
                          </div>
                        </div>
                        <div class="form-row" v-if="uBrasil.status.trim() == 'Fechado' || uBrasil_status_fechado == true">
                          <div class="col-2">
                            <label class="card-text">Fechado em:</label>
                          </div>
                          <div class="col-4">
                            <input :type="uBrasil.status.trim() === 'Fechado' ? 'text' : 'date'" 
                              :id="`dt-fechado-uBrasil${index}`"
                              :value="uBrasil.status.trim() === 'Fechado' ? uBrasil.f_dt_encerramento.trim() : todayDate"
                              :disabled="uBrasil.status.trim() === 'Fechado'"
                              class="fields_moreInfo width_moreInfo" >
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- FIM 2 - TAB UNIMED DO BRASIL -->

                <!-- TAB 3 - PLUSOFT -->
                <div
                  class="tab-pane fade p-0" 
                  id="3-fornecedor-plusoft" role="tabpanel" :aria-labelledby="`3-tab-fornecedor-plusoft`"
                > 
                  <ul class="nav nav-tabs card-header-tabs" role="tablist" >
                    <li v-for="(plusoft, index) in plusoftChamadoSelected" v-bind:key="`li-${index}-${plusoft.num_ticket}`" 
                      class="nav-item" >
                      <a 
                        @click="alteraAba(index, plusoft.status.trim(), 'plusoft')"
                        class="nav-link" :class="{'active show': index == 0 && chamado.fornecedor}" 
                        :id="`${index}-tab-${plusoft.num_ticket}`" data-toggle="tab" :href="`#${index}-${plusoft.num_ticket}`" role="tab" 
                        :aria-controls="`${index}-${plusoft.num_ticket}`" aria-selected="true"
                      >
                        {{plusoft.num_ticket}}
                      </a>
                    </li>
                  </ul>

                  <div class="card tab-card">
                    <div class="tab-content">
                      <div 
                        v-for="(plusoft, index) in plusoftChamadoSelected" v-bind:key="`li-${index}-${plusoft.num_ticket}`" 
                        :class="{'active show': index == 0 && chamado.fornecedor}"
                        class="tab-pane fade p-3 pt-2" :id="`${index}-${plusoft.num_ticket}`" 
                        role="tabpanel" :aria-labelledby="`${index}-tab-${plusoft.num_ticket}`"
                      >
                        <!-- cabeçalho do body -->
                        <div class="form-row">
                          <div class="col-10 pt-1">
                            <h6 class="card-title titleFornecedorGmudBody">
                              <a @click="goToLink(`${plusoft.link_ticket !== '' 
                                                  && plusoft.link_ticket !== null 
                                                  && plusoft.link_ticket !== undefined ? 
                                                  plusoft.link_ticket.trim() + `/` + plusoft.num_ticket.trim() :
                                                  plusoft.link_open_ticket.trim()}`)"
                              >{{plusoft.num_ticket}}</a>  - {{plusoft.titulo}}</h6> 
                          </div>
                          <div class="col-2 pt-0" style="text-align: right;">
                            <button 
                              v-if="plusoft.status.trim() !== 'Fechado'"
                              @click="deleteTicket(plusoft.num_chamado.trim(),plusoft.num_ticket.trim(),plusoft.id_fornecedor.trim())" 
                              class="btn-sm btn-danger ml-5" 
                            >
                            <i v-if="LoadIncluiExcluiTicket" class="fas fa-sync fa-spin"></i>
                            Excluir</button>
                          </div>
                        </div>
                        <hr class="p-0 mb-1">
                        <!-- Conteúdo do body -->
                        
                        <div class="form-row">
                          <div class="col-2">
                            <label class="card-text">Dt. Abertura:</label>
                          </div>
                          <div class="col-4">
                            <input disabled class="fields_moreInfo width_moreInfo" :value="plusoft.f_dt_abertura.trim()">
                          </div>
                          <div class="col-1">
                            <label>Status:</label>
                          </div>
                          <div class="col-4">
                            <select :id="`status-plusoft${index}`" 
                              v-on:change="statusChange(plusoft.status.trim(),index,'plusoft')"
                              :disabled="plusoft.f_dt_encerramento !== null ? true : false"
                              class="fields_moreInfo width_moreInfo"
                              :class="status_class_fornecedor(plusoft.status, plusoft.id_fornecedor)">
                              <option :selected="plusoft.status.trim() === 'Pendente fesp'" value="fesp">Pendente fesp</option>
                              <option :selected="plusoft.status.trim() === 'Pendente plusoft'" value="plusoft">Pendente plusoft</option>
                              <option :selected="plusoft.status.trim() === 'Fechado'" value="fechado">Fechado</option>
                            </select>
                          </div>
                          <div class="col-1" style="margin-top: -4px;"> <!-- icons -->
                            <i class="material-icons" 
                              v-if="plusoft_status_change_icon" 
                              @click.stop.prevent="alteraStatus(index, chamado.num_chamado, 
                                                                plusoft.num_ticket, 'plusoft')" 
                              style="cursor: pointer">
                              save
                            </i>
                            <i v-if="loadChangeStatusFornecedor" class="fas fa-sync fa-spin"></i>
                          </div>
                        </div>
                        <div class="form-row" v-if="plusoft.status.trim() == 'Fechado' || plusoft_status_fechado == true">
                          <div class="col-2">
                            <label class="card-text">Fechado em:</label>
                          </div>
                          <div class="col-4">
                            <input :type="plusoft.status.trim() === 'Fechado' ? 'text' : 'date'" 
                              :id="`dt-fechado-plusoft${index}`"
                              :value="plusoft.status.trim() === 'Fechado' ? plusoft.f_dt_encerramento.trim() : todayDate"
                              :disabled="plusoft.status.trim() === 'Fechado'"
                              class="fields_moreInfo width_moreInfo" >
                          </div>
                        </div>
                      
                      </div>
                    </div>
                  </div>
                </div>
                <!-- FIM 3 - TAB PLUSOFT -->

                <!-- TAB 4 - PROJURIS -->
                <div
                  class="tab-pane fade p-0" 
                  id="4-fornecedor-projuris" role="tabpanel" :aria-labelledby="`4-tab-fornecedor-projuris`"
                > 
                  <ul class="nav nav-tabs card-header-tabs" role="tablist" >
                    <li v-for="(projuris, index) in projurisChamadoSelected" v-bind:key="`li-${index}-${projuris.num_ticket}`" 
                      class="nav-item" >
                      <a 
                        @click="alteraAba(index, projuris.status.trim(), 'projuris')"
                        class="nav-link" :class="{'active show': index == 0 && chamado.fornecedor}" 
                        :id="`${index}-tab-${projuris.num_ticket}`" data-toggle="tab" :href="`#${index}-${projuris.num_ticket}`" role="tab" 
                        :aria-controls="`${index}-${projuris.num_ticket}`" aria-selected="true"
                      >
                        {{projuris.num_ticket}}
                      </a>
                    </li>
                  </ul>

                  <div class="card tab-card">
                    <div class="tab-content">
                      <div 
                        v-for="(projuris, index) in projurisChamadoSelected" v-bind:key="`li-${index}-${projuris.num_ticket}`" 
                        :class="{'active show': index == 0 && chamado.fornecedor}"
                        class="tab-pane fade p-3 pt-2" :id="`${index}-${projuris.num_ticket}`" 
                        role="tabpanel" :aria-labelledby="`${index}-tab-${projuris.num_ticket}`"
                      >
                        <!-- cabeçalho do body -->
                        <div class="form-row">
                          <div class="col-10 pt-1">
                            <h6 class="card-title titleFornecedorGmudBody">
                              <a @click="goToLink(`${projuris.link_ticket !== '' 
                                                  && projuris.link_ticket !== null 
                                                  && projuris.link_ticket !== undefined ? 
                                                  projuris.link_ticket.trim() + `/` + projuris.num_ticket.trim() :
                                                  projuris.link_open_ticket.trim()}`)"
                              >{{projuris.num_ticket}}</a>  - {{projuris.titulo}}</h6> 
                          </div>
                          <div class="col-2 pt-0" style="text-align: right;">
                            <button
                              v-if="projuris.status.trim() !== 'Fechado'"
                              @click="deleteTicket(projuris.num_chamado.trim(),projuris.num_ticket.trim(),projuris.id_fornecedor.trim())" 
                              class="btn-sm btn-danger ml-5" 
                            >
                            <i v-if="LoadIncluiExcluiTicket" class="fas fa-sync fa-spin"></i>
                            Excluir</button>
                          </div>
                        </div>
                        <hr class="p-0 mb-1">
                        <!-- Conteúdo do body -->
                        
                        <div class="form-row">
                          <div class="col-2">
                            <label class="card-text">Dt. Abertura:</label>
                          </div>
                          <div class="col-4">
                            <input disabled class="fields_moreInfo width_moreInfo" :value="projuris.f_dt_abertura.trim()">
                          </div>
                          <div class="col-1">
                            <label>Status:</label>
                          </div>
                          <div class="col-4">
                            <select :id="`status-projuris${index}`" 
                              v-on:change="statusChange(projuris.status.trim(),index,'projuris')"
                              :disabled="projuris.f_dt_encerramento !== null ? true : false"
                              class="fields_moreInfo width_moreInfo"
                              :class="status_class_fornecedor(projuris.status, projuris.id_fornecedor)">
                              <option :selected="projuris.status.trim() === 'Pendente fesp'" value="fesp">Pendente fesp</option>
                              <option :selected="projuris.status.trim() === 'Pendente projuris'" value="projuris">Pendente projuris</option>
                              <option :selected="projuris.status.trim() === 'Fechado'" value="fechado">Fechado</option>
                            </select>
                          </div>
                          <div class="col-1" style="margin-top: -4px;"> <!-- icons -->
                            <i class="material-icons" 
                              v-if="projuris_status_change_icon" 
                              @click.stop.prevent="alteraStatus(index, chamado.num_chamado, 
                                                                projuris.num_ticket, 'projuris')" 
                              style="cursor: pointer">
                              save
                            </i>
                            <i v-if="loadChangeStatusFornecedor" class="fas fa-sync fa-spin"></i>
                          </div>
                        </div>
                        <div class="form-row" v-if="projuris.status.trim() == 'Fechado' || projuris_status_fechado == true">
                          <div class="col-2">
                            <label class="card-text">Fechado em:</label>
                          </div>
                          <div class="col-4">
                            <input :type="projuris.status.trim() === 'Fechado' ? 'text' : 'date'" 
                              :id="`dt-fechado-projuris${index}`"
                              :value="projuris.status.trim() === 'Fechado' ? projuris.f_dt_encerramento.trim() : todayDate"
                              :disabled="projuris.status.trim() === 'Fechado'"
                              class="fields_moreInfo width_moreInfo" >
                          </div>
                        </div>
                      
                      </div>
                    </div>
                  </div>
                </div>
                <!-- FIM 4 - TAB PROJURIS -->

                <!-- TAB 5 - NEKIT -->
                <div
                  class="tab-pane fade p-0" 
                  id="5-fornecedor-nekit" role="tabpanel" :aria-labelledby="`5-tab-fornecedor-nekit`"
                > 
                  <ul class="nav nav-tabs card-header-tabs" role="tablist" >
                    <li v-for="(nekit, index) in nekitChamadoSelected" v-bind:key="`li-${index}-${nekit.num_ticket}`" 
                      class="nav-item" >
                      <a 
                        @click="alteraAba(index, nekit.status.trim(), 'nekit')"
                        class="nav-link" :class="{'active show': index == 0 && chamado.fornecedor}" 
                        :id="`${index}-tab-${nekit.num_ticket}`" data-toggle="tab" :href="`#${index}-${nekit.num_ticket}`" role="tab" 
                        :aria-controls="`${index}-${nekit.num_ticket}`" aria-selected="true"
                      >
                        {{nekit.num_ticket}}
                      </a>
                    </li>
                  </ul>

                  <div class="card tab-card">
                    <div class="tab-content">
                      <div 
                        v-for="(nekit, index) in nekitChamadoSelected" v-bind:key="`li-${index}-${nekit.num_ticket}`" 
                        :class="{'active show': index == 0 && chamado.fornecedor}"
                        class="tab-pane fade p-3 pt-2" :id="`${index}-${nekit.num_ticket}`" 
                        role="tabpanel" :aria-labelledby="`${index}-tab-${nekit.num_ticket}`"
                      >
                        <!-- cabeçalho do body -->
                        <div class="form-row">
                          <div class="col-10 pt-1">
                            <h6 class="card-title titleFornecedorGmudBody">
                              <a @click="goToLink(`${nekit.link_ticket !== '' 
                                                  && nekit.link_ticket !== null 
                                                  && nekit.link_ticket !== undefined ? 
                                                  nekit.link_ticket.trim() + `/` + nekit.num_ticket.trim() :
                                                  nekit.link_open_ticket.trim()}`)"
                              >{{nekit.num_ticket}}</a>  - {{nekit.titulo}}</h6> 
                          </div>
                          <div class="col-2 pt-0" style="text-align: right;">
                            <button
                              v-if="nekit.status.trim() !== 'Fechado'"
                              @click="deleteTicket(nekit.num_chamado.trim(),nekit.num_ticket.trim(),nekit.id_fornecedor.trim())" 
                              class="btn-sm btn-danger ml-5" 
                            >
                            <i v-if="LoadIncluiExcluiTicket" class="fas fa-sync fa-spin"></i>
                            Excluir</button>
                          </div>
                        </div>
                        <hr class="p-0 mb-1">
                        <!-- Conteúdo do body -->
                        
                        <div class="form-row">
                          <div class="col-2">
                            <label class="card-text">Dt. Abertura:</label>
                          </div>
                          <div class="col-4">
                            <input disabled class="fields_moreInfo width_moreInfo" :value="nekit.f_dt_abertura.trim()">
                          </div>
                          <div class="col-1">
                            <label>Status:</label>
                          </div>
                          <div class="col-4">
                            <select :id="`status-nekit${index}`" 
                              v-on:change="statusChange(nekit.status.trim(),index,'nekit')"
                              :disabled="nekit.f_dt_encerramento !== null ? true : false"
                              class="fields_moreInfo width_moreInfo"
                              :class="status_class_fornecedor(nekit.status, nekit.id_fornecedor)">
                              <option :selected="nekit.status.trim() === 'Pendente fesp'" value="fesp">Pendente fesp</option>
                              <option :selected="nekit.status.trim() === 'Pendente nekit'" value="nekit">Pendente nekit</option>
                              <option :selected="nekit.status.trim() === 'Fechado'" value="fechado">Fechado</option>
                            </select>
                          </div>
                          <div class="col-1" style="margin-top: -4px;"> <!-- icons -->
                            <i class="material-icons" 
                              v-if="nekit_status_change_icon" 
                              @click.stop.prevent="alteraStatus(index, chamado.num_chamado, 
                                                                nekit.num_ticket, 'nekit')" 
                              style="cursor: pointer">
                              save
                            </i>
                            <i v-if="loadChangeStatusFornecedor" class="fas fa-sync fa-spin"></i>
                          </div>
                        </div>
                        <div class="form-row" v-if="nekit.status.trim() == 'Fechado' || nekit_status_fechado == true">
                          <div class="col-2">
                            <label class="card-text">Fechado em:</label>
                          </div>
                          <div class="col-4">
                            <input :type="nekit.status.trim() === 'Fechado' ? 'text' : 'date'" 
                              :id="`dt-fechado-nekit${index}`"
                              :value="nekit.status.trim() === 'Fechado' ? nekit.f_dt_encerramento.trim() : todayDate"
                              :disabled="nekit.status.trim() === 'Fechado'"
                              class="fields_moreInfo width_moreInfo" >
                          </div>
                        </div>
                      
                      </div>
                    </div>
                  </div>
                </div>
                <!-- FIM 5 - TAB NEKIT -->

                <!-- TAB 6 - PENSO -->
                <div
                  class="tab-pane fade p-0" 
                  id="6-fornecedor-penso" role="tabpanel" :aria-labelledby="`6-tab-fornecedor-penso`"
                > 
                  <ul class="nav nav-tabs card-header-tabs" role="tablist" >
                    <li v-for="(penso, index) in pensoChamadoSelected" v-bind:key="`li-${index}-${penso.num_ticket}`" 
                      class="nav-item" >
                      <a 
                        @click="alteraAba(index, penso.status.trim(), 'penso')"
                        class="nav-link" :class="{'active show': index == 0 && chamado.fornecedor}" 
                        :id="`${index}-tab-${penso.num_ticket}`" data-toggle="tab" :href="`#${index}-${penso.num_ticket}`" role="tab" 
                        :aria-controls="`${index}-${penso.num_ticket}`" aria-selected="true"
                      >
                        {{penso.num_ticket}}
                      </a>
                    </li>
                  </ul>

                  <div class="card tab-card">
                    <div class="tab-content">
                      <div 
                        v-for="(penso, index) in pensoChamadoSelected" v-bind:key="`li-${index}-${penso.num_ticket}`" 
                        :class="{'active show': index == 0 && chamado.fornecedor}"
                        class="tab-pane fade p-3 pt-2" :id="`${index}-${penso.num_ticket}`" 
                        role="tabpanel" :aria-labelledby="`${index}-tab-${penso.num_ticket}`"
                      >
                        <!-- cabeçalho do body -->
                        <div class="form-row">
                          <div class="col-10 pt-1">
                            <h6 class="card-title titleFornecedorGmudBody">
                              <a @click="goToLink(`${penso.link_ticket !== '' 
                                                  && penso.link_ticket !== null 
                                                  && penso.link_ticket !== undefined ? 
                                                  penso.link_ticket.trim() + `/` + penso.num_ticket.trim() :
                                                  penso.link_open_ticket.trim()}`)"
                              >{{penso.num_ticket}}</a>  - {{penso.titulo}}</h6> 
                          </div>
                          <div class="col-2 pt-0" style="text-align: right;">
                            <button
                              v-if="penso.status.trim() !== 'Fechado'"
                              @click="deleteTicket(penso.num_chamado.trim(),penso.num_ticket.trim(),penso.id_fornecedor.trim())" 
                              class="btn-sm btn-danger ml-5" >
                              <i v-if="LoadIncluiExcluiTicket" class="fas fa-sync fa-spin"></i>
                              Excluir</button>
                          </div>
                        </div>
                        <hr class="p-0 mb-1">
                        <!-- Conteúdo do body -->
                        
                        <div class="form-row">
                          <div class="col-2">
                            <label class="card-text">Dt. Abertura:</label>
                          </div>
                          <div class="col-4">
                            <input disabled class="fields_moreInfo width_moreInfo" :value="penso.f_dt_abertura.trim()">
                          </div>
                          <div class="col-1">
                            <label>Status:</label>
                          </div>
                          <div class="col-4">
                            <select :id="`status-penso${index}`" 
                              v-on:change="statusChange(penso.status.trim(),index,'penso')"
                              :disabled="penso.f_dt_encerramento !== null ? true : false"
                              class="fields_moreInfo width_moreInfo"
                              :class="status_class_fornecedor(penso.status, penso.id_fornecedor)">
                              <option :selected="penso.status.trim() === 'Pendente fesp'" value="fesp">Pendente fesp</option>
                              <option :selected="penso.status.trim() === 'Pendente penso'" value="penso">Pendente penso</option>
                              <option :selected="penso.status.trim() === 'Fechado'" value="fechado">Fechado</option>
                            </select>
                          </div>
                          <div class="col-1" style="margin-top: -4px;"> <!-- icons -->
                            <i class="material-icons" 
                              v-if="penso_status_change_icon" 
                              @click.stop.prevent="alteraStatus(index, chamado.num_chamado, 
                                                                penso.num_ticket, 'penso')" 
                              style="cursor: pointer">
                              save
                            </i>
                            <i v-if="loadChangeStatusFornecedor" class="fas fa-sync fa-spin"></i>
                          </div>
                        </div>
                        <div class="form-row" v-if="penso.status.trim() == 'Fechado' || penso_status_fechado == true">
                          <div class="col-2">
                            <label class="card-text">Fechado em:</label>
                          </div>
                          <div class="col-4">
                            <input :type="penso.status.trim() === 'Fechado' ? 'text' : 'date'" 
                              :id="`dt-fechado-penso${index}`"
                              :value="penso.status.trim() === 'Fechado' ? penso.f_dt_encerramento.trim() : todayDate"
                              :disabled="penso.status.trim() === 'Fechado'"
                              class="fields_moreInfo width_moreInfo" >
                          </div>
                        </div>
                      
                      </div>
                    </div>
                  </div>
                </div>
                <!-- FIM 6 - TAB PENSO -->

                <!-- TAB 0 - Incluir novo ticket -->
                <div 
                  class="active show tab-pane p-3 pt-0 pb-2 fade inclui-fornecedor" 
                  id="0-fornecedor" role="tabpanel" :aria-labelledby="`0-tab-fornecedor`"
                >
                  <div class="form-row">
                    <div class="col-5">
                      <label v-if="model_fornecedor == 'Selecione fornecedor...'" class="card-title">Incluir novo ticket</label>
                      <label v-if="model_fornecedor == 'totvs'" class="card-title">
                        <a @click="goToLink(`${totvs_open !== '' 
                                            && totvs_open !== null 
                                            && totvs_open !== undefined ? 
                                            totvs_open.trim() :
                                            ''}`)"
                        >Incluir Novo</a>
                      </label>
                      <label v-if="model_fornecedor == 'uBrasil'" class="card-title">
                        <a @click="goToLink(`${uBrasil_open !== '' 
                                            && uBrasil_open !== null 
                                            && uBrasil_open !== undefined ? 
                                            uBrasil_open.trim() :
                                            ''}`)"
                        >Incluir Novo</a>
                      </label>
                      <label v-if="model_fornecedor == 'plusoft'" class="card-title">
                        <a @click="goToLink(`${plusoft_open !== '' 
                                            && plusoft_open !== null 
                                            && plusoft_open !== undefined ? 
                                            plusoft_open.trim() :
                                            ''}`)"
                        >Incluir Novo</a>
                      </label>
                      <label v-if="model_fornecedor == 'projuris'" class="card-title">
                        <a @click="goToLink(`${projuris_open !== '' 
                                            && projuris_open !== null 
                                            && projuris_open !== undefined ? 
                                            projuris_open.trim() :
                                            ''}`)"
                        >Incluir Novo</a>
                      </label>
                      <label v-if="model_fornecedor == 'nekit'" class="card-title">
                        <a @click="goToLink(`${nekit_open !== '' 
                                            && nekit_open !== null 
                                            && nekit_open !== undefined ? 
                                            nekit_open.trim() :
                                            ''}`)"
                        >Incluir Novo</a>
                      </label>
                      <label v-if="model_fornecedor == 'penso'" class="card-title">
                        <a @click="goToLink(`${penso_open !== '' 
                                            && penso_open !== null 
                                            && penso_open !== undefined ? 
                                            penso_open.trim() :
                                            ''}`)"
                        >Incluir Novo</a>
                      </label>
                    </div>
                    <div class="col-2">
                      <label>Fornecedor:</label>
                    </div>
                    <div class="col-3 px-0 mx-0">
                      <select v-model="model_fornecedor" class="fields_moreInfo width_moreInfo px-0">
                        <option selected>Selecione fornecedor...</option>
                        <option value="totvs">Totvs</option>
                        <option value="uBrasil">Unimed do Brasil</option>
                        <option value="plusoft">Plusoft</option>
                        <option value="projuris">Projuris</option>
                        <option value="nekit">Nekit</option>
                        <option value="penso">Penso</option>
                      </select>
                    </div>
                    <div v-if="model_fornecedor !== 'Selecione fornecedor...' && t_nr_ticket !== ''"
                      class="col-2" style="text-align: right;"
                      >
                      <button class="btn-sm btn-primary incluirTotvsFornecedorButton"
                        @click.prevent.stop="createTicket(chamado.id_chamado.trim(),chamado.num_chamado.trim(), model_fornecedor.trim(), chamado.categoria.trim(),chamado.p_first_name.trim())">
                        <i v-if="LoadIncluiExcluiTicket" class="fas fa-sync fa-spin"></i> 
                        Incluir
                      </button>
                    </div>
                  </div>
                  <!-- conforme seleciona um fornecedor acima, ele altera o model_fornecedor e de acordo com esse model_fornecedor
                  eu mostro um dos templates abaixo: -->

                  <div v-if="model_fornecedor !== 'Selecione fornecedor...'">
                    <div class="pt-2 pb-2">
                      <div class="form-row">
                        <div class="col-2">
                          <label>Dt. Abertura:</label>
                        </div>
                        <div class="col-3">
                          <input type="date" id="dt-abertura-fornecedor" 
                          class="fields_moreInfo width_moreInfo" :value="todayDate">
                        </div>
                        <div class="col-1">
                          <label>Ticket:</label>
                        </div>
                        <div class="col-2">
                          <input v-model="t_nr_ticket" id="chamado-fornecedor" type="text" 
                            class="fields_moreInfo width_moreInfo" >
                        </div>
                        <div class="col-1">
                          <label>Status:</label>
                        </div>
                        <div class="col-3">
                          <select v-model="t_status" id="status-fornecedor" class="fields_moreInfo width_moreInfo">
                            <option value="fesp">Pendente fesp</option>
                            <option :value="model_fornecedor">Pendente {{model_fornecedor}}</option>
                            <option value="fechado">Fechado</option>
                          </select>
                        </div>
                      </div>
                      <div class="form-row">
                        <div class="col-2">
                          <label>Título:</label>
                        </div>
                        <div class="col-10">
                          <input type="text" id="titulo-fornecedor"
                            class="fields_moreInfo width_moreInfo">
                        </div>
                      </div>  
                      <!-- TOTVS TEMPLATE -->       
                      <template v-if="model_fornecedor == 'totvs'">
                        <div class="form-row">
                          <div class="col-2">
                            <label>Versão:</label>
                          </div>
                          <div class="col-2">
                            <input type="text" id="versao-totvs" 
                              class="fields_moreInfo width_moreInfo" value="12.1.26">
                          </div>
                          <div class="col-3">
                            <label>Impede Atualização?</label>
                          </div>
                          <div class="col-1">
                            <select id="impede" class="fields_moreInfo width_moreInfo px-0"
                            style="margin-left: -10px; width: 52px;">
                              <option value="nao">NAO</option>
                              <option value="sim">SIM</option>
                            </select>
                          </div>
                          <div v-if="t_status == 'fechado'" class="col-2"
                          style="margin-left: -0px;">
                            <label>Versão Futura:</label>
                          </div>
                          <div v-if="t_status == 'fechado'" class="col-2"
                          style="margin-left: -5px;">
                            <input type="text" id="versao_futura"
                              class="fields_moreInfo width_moreInfo">
                          </div>  
                        </div>
                      </template>
                      <div class="form-row" v-if="chamado.num_chamado.trim().length !== 14">
                        <div class="col-5">
                          <input type="checkbox" value='checked' name="incluirTextoTicket" id="incluirTextoTicket"
                            style="margin-left: -73px;">
                          <label class="card-text"
                            style="margin-left: -70px;">Incluir no chamado</label>
                        </div>
                        <div class="col-5" v-if="chamado.num_chamado.trim().length == 11">
                          <input type="checkbox" value='checked' name="incluirInvisivelTicket" id="incluirInvisivelTicket"
                            style="margin-left: -73px;">
                          <label class="card-text"
                            style="margin-left: -70px;">Invisível</label>
                        </div>
                      </div> 
                    </div>
                  </div>
                </div>   
                <!-- FIM TAB 0 - Incluir novo ticket -->
              </div>
            </div>
          </div>

        </v-card>
        <!-- Fim Dados Fornecedor -->

        <!-- Dados Gmud -->
        <v-card class="mb-1">
          <v-card-title>
            <span class="titleFornecedorGmud">GMUDS</span>
          </v-card-title>

          <div class="col-12 pt-0">
            <!-- nav tabs -->
            <ul class="nav nav-tabs card-header-tabs" id="myGmudTab" role="tablist" >
              <li v-for="(gmud, index) in gmudChamadoSelected" v-bind:key="`li-${index}-${gmud.num_gmud}`" class="nav-item" >
                <a 
                  class="nav-link" :class="{'active show': index == 0 && chamado.gmud}" 
                  :id="`${index+1}-tab-gmud`" data-toggle="tab" :href="`#${index+1}-gmud`" role="tab" 
                  :aria-controls="`${index+1}-gmud`" aria-selected="true"
                >
                  {{gmud.num_gmud}}
                </a>
              </li>
              <li class="nav-item" >
                <a class="nav-link"
                  :class="{'active show': !chamado.gmud }"
                  :id="`0-tab-gmud`" data-toggle="tab" :href="`#0-gmud`" 
                  role="tab" :aria-controls="`0-gmud`" aria-selected="false"
                >
                  <i class="material-icons addTotvsGmudIcon">add_circle_outline</i>
                </a>
              </li>
            </ul>

            <div class="card tab-card">

              <!-- body -->
              <div class="tab-content">
                <div 
                  v-for="(gmud, index) in gmudChamadoSelected" v-bind:key="`content-${index}-${gmud.num_gmud}`"
                  :class="{'active show': index == 0 && chamado.gmud}"
                  class="tab-pane fade p-3 pt-2" :id="`${index+1}-gmud`" 
                  role="tabpanel" :aria-labelledby="`${index+1}-tab-gmud`"
                >
                  <div class="form-row">
                    <div class="col-10 pt-1">
                      <h6 class="card-title titleFornecedorGmudBody">
                        <a
                          @click.stop="goToLink(gmud.link_gmud)"
                          target="_blank"
                        >{{gmud.num_gmud}}</a>  - {{gmud.titulo}} </h6> 
                    </div>
                    <div class="col-2 pt-0" style="text-align: right;" >
                      <button 
                        @click.prevent.stop="deleteGmud(gmud.num_gmud.trim(), gmud.num_chamado.trim())" 
                        class="btn-sm btn-danger">
                        <i v-if="LoadIncluiExcluiGmud" class="fas fa-sync fa-spin"></i>
                        Excluir
                      </button>
                    </div>
                  </div>
                  <hr class="p-0 mb-1">
                  
                  <div class="form-row">
                    <div class="col-2">
                      <label class="card-text">Dt. Abertura:</label>
                    </div>
                    <div class="col-4">
                      <input disabled class="fields_moreInfo width_moreInfo" :value="gmud.f_dt_abertura">
                    </div>
                    <div class="col-2" style="text-align: right">
                      <label>Status:</label>
                    </div>
                    <div class="col-4">
                      <input disabled class="fields_moreInfo width_moreInfo" :value="gmud.status">
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="col-2">
                      <label class="card-text">Solicitante:</label>
                    </div>
                    <div class="col-6">
                      <input disabled class="fields_moreInfo width_moreInfo" :value="gmud.p_full_name">
                    </div>
                    <div class="col-2">
                      <label>Categoria:</label>
                    </div>
                    <div class="col-2">
                      <input disabled class="fields_moreInfo width_moreInfo" :value="gmud.categoria">
                    </div>
                  </div>
                  <div class="form-row" >
                    <div class="col-2">
                      <label>Motivo:</label>
                    </div>
                    <div class="col-10">
                      <textarea 
                        disabled 
                        class="width_moreInfo textAreaMoreInfo form-control" 
                        rows="3" 
                        :value="gmud.motivo"
                      ></textarea>
                    </div>
                  </div>
                  <div class="form-row" v-if="gmud.programs !== '' && gmud.programs !== null && gmud.programs !== undefined ">
                    <div class="col-2">
                      <label>Programas:</label>
                    </div>
                    <div class="col-10">
                      <textarea 
                        disabled 
                        class="width_moreInfo textAreaMoreInfo form-control " 
                        rows="2" 
                        :value="gmud.programs"
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                <div 
                  :class="{'active show': !chamado.gmud }"
                  class="tab-pane fade p-3 pt-0 pb-2" 
                  id="0-gmud" role="tabpanel" aria-labelledby="0-tab-gmud">

                  <div class="form-row">
                    <div class="col-5">
                      <label class="card-title">Incluir nova GMUD</label>
                    </div>
                    <div class="col-2">
                      <label>Nº Gmud:</label>
                    </div>
                    <div class="col-3">
                      <input type="text" class="fields_moreInfo width_moreInfo" v-model="inputGmudValue">
                    </div>
                    <div class="col-2" style="text-align: right;">
                      <button v-if="inputGmudValue !== ''"
                        @click.prevent.stop="createGmud(inputGmudValue.trim(), chamado.num_chamado.trim())" 
                        class="btn-sm btn-primary incluirTotvsFornecedorButton">
                        <i v-if="LoadIncluiExcluiGmud" class="fas fa-sync fa-spin"></i> 
                        Incluir
                      </button>
                    </div>
                  </div>

                </div>
          
              </div>
            </div>
          </div>
        </v-card>
        <!-- Fim Dados Gmud -->

      </div> 
    </template>
    <!-- End More informations -->

  </div>
</template>

<script>

  import ChamadosService from "../../ChamadosService";

  export default {
    
    data() {
      return {
        todayDate: new Date().getFullYear() + '-' + ('0' + (new Date().getMonth() + 1)).slice(-2) + '-' + ('0' + new Date().getDate()).slice(-2),
        inputGmudValue: '',
        status: '',
        search: '',
        login_rede_user_logged: null,
        chamados: [],
        openChamados: [],
        checkboxClosed: false,
        gmuds: [],
        totvs: [],
        uBrasil: [],
        plusoft: [],
        projuris: [],
        nekit: [],
        penso: [],
        fornecedores: [],
        totvs_open: '',
        uBrasil_open: '',
        plusoft_open: '',
        projuris_open: '',
        nekit_open: '',
        penso_open: '',
        dataChamadoMoreInfo: [],
        dataGmudMoreInfo: [],
        dataTotvsMoreInfo: [],
        dataUBrasilMoreInfo: [],
        dataPlusoftMoreInfo: [],
        dataProjurisMoreInfo: [],
        dataNekitMoreInfo: [],
        dataPensoMoreInfo: [],
        dataStatus: '',
        dataFornecedor: '',
        dataChamadoNumber: '',
        dataId: '',
        dataTitulo: '',
        dataSolicitante: '',
        tableExpanded: true,
        tableWidht : true,
        chamadoMoreInfo: '',
        input_syncTopdesk: '',
        incluidoExcluidoGmud: false,
        incluidoExcluidoTotvs: false,
        incluidoExcluidoUBrasil: false,
        incluidoExcluidoPlusoft: false,
        incluidoExcluidoProjuris: false,
        incluidoExcluidoNekit: false,
        incluidoExcluidoPenso: false,
        model_fornecedor: 'Selecione fornecedor...',
        t_nr_ticket: '',
        t_status: '',  //quando totvs, se o status for fechado apresento alguns campos a mais
        initialLoad: false,
        LoadSyncTopDesk: false,
        LoadUpdateStatus: false,
        LoadIncluiExcluiTicket: false,
        loadChangeStatusFornecedor: false,
        LoadIncluiExcluiGmud: false,
        totvs_status_change_icon: false,
        totvs_status_fechado: false,
        uBrasil_status_change_icon: false,
        uBrasil_status_fechado: false,
        plusoft_status_change_icon: false,
        plusoft_status_fechado: false,
        projuris_status_change_icon: false,
        projuris_status_fechado: false,
        nekit_status_change_icon: false,
        nekit_status_fechado: false,
        penso_status_change_icon: false,
        penso_status_fechado: false,
      };
    },

    async created() {
      this.initialLoad = true;
      await this.getDataFromServer({  
              table: '' ,closed: true, whereTable: '', whereField: '', whereValue:  '', sync: false,
            });
      await this.configDataTable();
      this.initialLoad = false;
    },
   
    asyncComputed: {

      async chamadoSelected(){
        
        /* toda vez que eu alterar o this.chamadoMoreInfo na function getNewChamado ele vai
          chamar essa função chamadoSelected, pois o chamadoMoreInfo é um item da função 
          que foi modificado, assim que funciona o computed */
        this.dataChamadoMoreInfo = [];

         for (let i = 0; i < this.chamados.length; i++) {

          if (this.chamados[i].num_chamado == this.chamadoMoreInfo) {
            
            //dou um for each em todos os chamados e quando achar o mesmo que foi selecionado, ele entra e
            //salva os dados na variavel this.dataChamadoMoreInfo
            this.dataChamadoMoreInfo.push(this.chamados[i]);
          }
        } 
        return this.dataChamadoMoreInfo;
        
      },
      async gmudChamadoSelected(){
         if (this.incluidoExcluidoGmud) {
          await this.getChamadoGmudTicket('gmud', false);
          this.incluidoExcluidoGmud = false;

          //se incluidoExcluidoGmud era true e entrou aqui, significa que criei ou deletei uma gmud
          $('#0-gmud').removeClass('active show');
          $('#0-tab-gmud').removeClass('active show');

          $('#1-gmud').addClass('active show');
          $('#1-tab-gmud').addClass('active show');

          this.inputGmudValue = ''; //limpar o campo em que digita a gmud para ser incluida
        };

        this.dataGmudMoreInfo = [];
        
        if (!this.tableExpanded) {
          
          for (let i = 0; i < this.gmuds.length; i++) {
            if (this.gmuds[i].num_chamado.trim() == this.chamadoMoreInfo.trim()) {
              this.dataGmudMoreInfo.push(this.gmuds[i]);
            }
          }
          this.LoadIncluiExcluiGmud = false;
          return this.dataGmudMoreInfo;
        };
        this.LoadIncluiExcluiGmud = false;
      },
      async totvsChamadoSelected(){
        if (this.incluidoExcluidoTotvs == 'create' || this.incluidoExcluidoTotvs == 'delete') {
          await this.getChamadoGmudTicket('ticket', false);
        };

        if (this.incluidoExcluidoTotvs == 'create') {
          $('#0-fornecedor').removeClass('active show');
          $('#0-tab-fornecedor').removeClass('active show');

          $('#1-fornecedor-totvs').addClass('active show');
          $('#1-tab-fornecedor-totvs').addClass('active show');
        };
        if (this.incluidoExcluidoTotvs == 'delete') {
          $('#0-fornecedor').addClass('active show');
          $('#0-tab-fornecedor').addClass('active show');

          $('#1-fornecedor-totvs').removeClass('active show');
          $('#1-tab-fornecedor-totvs').removeClass('active show');
        };
        this.incluidoExcluidoTotvs = false;

        this.dataTotvsMoreInfo = [];
        
        if (!this.tableExpanded) {
          for (let i = 0; i < this.totvs.length; i++) {
            if (this.totvs[i].num_chamado.trim() == this.chamadoMoreInfo.trim()) {
              this.dataTotvsMoreInfo.push(this.totvs[i]);
            }
          };          
          this.LoadIncluiExcluiTicket = false;
          return this.dataTotvsMoreInfo;
        };
        this.LoadIncluiExcluiTicket = false;

      },
      async uBrasilChamadoSelected(){
        if (this.incluidoExcluidoUBrasil == 'create' || this.incluidoExcluidoUBrasil == 'delete') {
          await this.getChamadoGmudTicket('ticket', false);
        };

        if (this.incluidoExcluidoUBrasil == 'create') {
          $('#0-fornecedor').removeClass('active show');
          $('#0-tab-fornecedor').removeClass('active show');

          $('#2-fornecedor-uBrasil').addClass('active show');
          $('#2-tab-fornecedor-uBrasil').addClass('active show');
        };
        if (this.incluidoExcluidoUBrasil == 'delete') {
          $('#0-fornecedor').addClass('active show');
          $('#0-tab-fornecedor').addClass('active show');

          $('#2-fornecedor-uBrasil').removeClass('active show');
          $('#2-tab-fornecedor-uBrasil').removeClass('active show');
        };
        this.incluidoExcluidoUBrasil = false;

        this.dataUBrasilMoreInfo = [];
        if (!this.tableExpanded) {
          //uBrasil
          for (let i = 0; i < this.uBrasil.length; i++) {
            if (this.uBrasil[i].num_chamado.trim() == this.chamadoMoreInfo.trim()) {
              this.dataUBrasilMoreInfo.push(this.uBrasil[i]);
            }
          }
          this.LoadIncluiExcluiTicket = false;
          return this.dataUBrasilMoreInfo;
        };
          
        this.LoadIncluiExcluiTicket = false;
      },
      async plusoftChamadoSelected(){
        if (this.incluidoExcluidoPlusoft == 'create' || this.incluidoExcluidoPlusoft == 'delete') {
          await this.getChamadoGmudTicket('ticket', false);
        };

        if (this.incluidoExcluidoPlusoft == 'create') {
          $('#0-fornecedor').removeClass('active show');
          $('#0-tab-fornecedor').removeClass('active show');

          $('#3-fornecedor-plusoft').addClass('active show');
          $('#3-tab-fornecedor-plusoft').addClass('active show');
        };
        if (this.incluidoExcluidoPlusoft == 'delete') {
          $('#0-fornecedor').addClass('active show');
          $('#0-tab-fornecedor').addClass('active show');

          $('#3-fornecedor-plusoft').removeClass('active show');
          $('#3-tab-fornecedor-plusoft').removeClass('active show');
        };
        this.incluidoExcluidoPlusoft = false;

        this.dataPlusoftMoreInfo = [];
          if (!this.tableExpanded) {
            //plusoft
            for (let i = 0; i < this.plusoft.length; i++) {
              if (this.plusoft[i].num_chamado.trim() == this.chamadoMoreInfo.trim()) {
                this.dataPlusoftMoreInfo.push(this.plusoft[i]);
              }
            }
            this.LoadIncluiExcluiTicket = false;
            return this.dataPlusoftMoreInfo;
          };
          
          this.LoadIncluiExcluiTicket = false;
      },
      async projurisChamadoSelected(){
        if (this.incluidoExcluidoProjuris == 'create' || this.incluidoExcluidoProjuris == 'delete') {
          await this.getChamadoGmudTicket('ticket', false);
        };

        if (this.incluidoExcluidoProjuris == 'create') {
          $('#0-fornecedor').removeClass('active show');
          $('#0-tab-fornecedor').removeClass('active show');

          $('#4-fornecedor-projuris').addClass('active show');
          $('#4-tab-fornecedor-projuris').addClass('active show');
        };
        if (this.incluidoExcluidoProjuris == 'delete') {
          $('#0-fornecedor').addClass('active show');
          $('#0-tab-fornecedor').addClass('active show');

          $('#4-fornecedor-projuris').removeClass('active show');
          $('#4-tab-fornecedor-projuris').removeClass('active show');
        };
        this.incluidoExcluidoProjuris = false;

        this.dataProjurisMoreInfo = [];
          if (!this.tableExpanded) {
            //projuris
            for (let i = 0; i < this.projuris.length; i++) {
              if (this.projuris[i].num_chamado.trim() == this.chamadoMoreInfo.trim()) {
                this.dataProjurisMoreInfo.push(this.projuris[i]);
              }
            }
            this.LoadIncluiExcluiTicket = false;
            return this.dataProjurisMoreInfo;
          };
          
          this.LoadIncluiExcluiTicket = false;
      },
      async nekitChamadoSelected(){
        if (this.incluidoExcluidoNekit == 'create' || this.incluidoExcluidoNekit == 'delete') {
          await this.getChamadoGmudTicket('ticket', false);
        };

        if (this.incluidoExcluidoNekit == 'create') {
          $('#0-fornecedor').removeClass('active show');
          $('#0-tab-fornecedor').removeClass('active show');

          $('#5-fornecedor-nekit').addClass('active show');
          $('#5-tab-fornecedor-nekit').addClass('active show');
        };
        if (this.incluidoExcluidoNekit == 'delete') {
          $('#0-fornecedor').addClass('active show');
          $('#0-tab-fornecedor').addClass('active show');

          $('#5-fornecedor-nekit').removeClass('active show');
          $('#5-tab-fornecedor-nekit').removeClass('active show');
        };
        this.incluidoExcluidoNekit = false;

        this.dataNekitMoreInfo = [];
          if (!this.tableExpanded) {
            //nekit
            for (let i = 0; i < this.nekit.length; i++) {
              if (this.nekit[i].num_chamado.trim() == this.chamadoMoreInfo.trim()) {
                this.dataNekitMoreInfo.push(this.nekit[i]);
              }
            }
            this.LoadIncluiExcluiTicket = false;
            return this.dataNekitMoreInfo;
          };
          
          this.LoadIncluiExcluiTicket = false;
      },
      async pensoChamadoSelected(){
        if (this.incluidoExcluidoPenso == 'create' || this.incluidoExcluidoPenso == 'delete') {
          await this.getChamadoGmudTicket('ticket', false);
        };

        if (this.incluidoExcluidoPenso == 'create') {
          $('#0-fornecedor').removeClass('active show');
          $('#0-tab-fornecedor').removeClass('active show');

          $('#6-fornecedor-penso').addClass('active show');
          $('#6-tab-fornecedor-penso').addClass('active show');
        };
        if (this.incluidoExcluidoPenso == 'delete') {
          $('#0-fornecedor').addClass('active show');
          $('#0-tab-fornecedor').addClass('active show');

          $('#6-fornecedor-penso').removeClass('active show');
          $('#6-tab-fornecedor-penso').removeClass('active show');
        };
        this.incluidoExcluidoPenso = false;

        this.dataPensoMoreInfo = [];
          if (!this.tableExpanded) {
            //penso
            for (let i = 0; i < this.penso.length; i++) {
              if (this.penso[i].num_chamado.trim() == this.chamadoMoreInfo.trim()) {
                this.dataPensoMoreInfo.push(this.penso[i]);
              }
            }
            this.LoadIncluiExcluiTicket = false;
            return this.dataPensoMoreInfo;
          };

          this.LoadIncluiExcluiTicket = false;
      },
    }, 
    methods: {
      async statusFornecedorDB(id, fornecedor){
        let status = '';
        if ($(id).val() == fornecedor) {
          status = `Pendente ${fornecedor}`;
        }else if ($(id).val() == 'fesp') {
          status = 'Pendente fesp';
        }else if ($(id).val() !== null && $(id).val() !== undefined) {
          status = 'Fechado';
        };
        return status;
      },
      async alteraStatus(index, num_chamado, num_ticket, fornecedor){

        this.loadChangeStatusFornecedor = true;

        const id_status = `#status-${fornecedor}${index}`;
        const id_vf = `#versao-futura-totvs${index}`;
        const id_df = `#dt-fechado-${fornecedor}${index}`;
        const dt_encerramento = $(id_df).val();
        const versao_futura = $(id_vf).val();

        if ($(id_status).val() !== null && $(id_status).val() !== undefined) {

          const newStatus = await this.statusFornecedorDB(id_status,fornecedor);
          let validaFechado = '';
          let data = false;

          const id_fornecedor = this.get_id_fornecedor(fornecedor.trim());

          if (newStatus == 'Fechado') {
            if (fornecedor == 'totvs') {
              
               if (versao_futura == '' || versao_futura == null || versao_futura == undefined) {
                validaFechado += 'Versão Futura; ';
              };
            };
            if (dt_encerramento == '' || dt_encerramento == null || dt_encerramento == undefined) {
              validaFechado += 'Fechado em; ';
            };

            if (validaFechado !== '') {
              validaFechado = `Favor preencher os seguintes campos: ${validaFechado}.`;
              this.notification(validaFechado,'error', 'PREENCHA TODOS OS CAMPOS');
            }else{
              //caso seja fechado e os dois campos foram preenchidos, eu preencho o data
              if (fornecedor == 'totvs') {
                data = {
                  num_chamado, num_ticket, newStatus, dt_encerramento, versao_futura, id_fornecedor
                };
              }else{
                data = {
                  num_chamado, num_ticket, newStatus, dt_encerramento, id_fornecedor
                };
              };
            };
          }else{
            //se não for fechado, mando o 'data' sem os campos dt_encerra e ver_futura
            data = {
              num_chamado, num_ticket, newStatus, id_fornecedor
            };
          };

          if (data !== false) {
            try {
              const resUpdateStatus = await ChamadosService.updateStatusTicket(data);
            } catch (error) {
              this.error = `Erro 039: ${error}`;
              console.log(this.error);
              this.notification(this.error,'error','ERRO AO ALTERAR STATUS FORNECEDOR');
            };
            console.log('passei aqui e coloquei false');
            
            
            this.totvs_status_fechado = false; //quando fechava um ticket e ia pra outro, ele mostrava os campos de fechado

            this.totvs_status_change_icon = false
            this.uBrasil_status_change_icon = false
            this.plusoft_status_change_icon = false
            this.projuris_status_change_icon = false
            this.nekit_status_change_icon = false
            this.penso_status_change_icon = false
            await this.getChamadoGmudTicket('ticket', false);
          };
          
        };
        this.loadChangeStatusFornecedor = false;
      },
      async statusChange(statusDB, index, fornecedor){
        const id_status = `#status-${fornecedor}${index}`;
        const newStatus = await this.statusFornecedorDB(id_status,fornecedor);

        if (statusDB !== newStatus) {
          if (fornecedor == 'totvs') {
            this.totvs_status_change_icon = true
          }else if (fornecedor == 'uBrasil') {
            this.uBrasil_status_change_icon = true
          }else if (fornecedor == 'plusoft') {
            this.plusoft_status_change_icon = true
          }else if (fornecedor == 'projuris') {
            this.projuris_status_change_icon = true
          }else if (fornecedor == 'nekit') {
            this.nekit_status_change_icon = true
          }else if (fornecedor == 'penso') {
            this.penso_status_change_icon = true
          }
        }else {
          if (fornecedor == 'totvs') {
            this.totvs_status_change_icon = false
          }else if (fornecedor == 'uBrasil') {
            this.uBrasil_status_change_icon = false
          }else if (fornecedor == 'plusoft') {
            this.plusoft_status_change_icon = false
          }else if (fornecedor == 'projuris') {
            this.projuris_status_change_icon = false
          }else if (fornecedor == 'nekit') {
            this.nekit_status_change_icon = false
          }else if (fornecedor == 'penso') {
            this.penso_status_change_icon = false
          }
        };
        
        if (newStatus == 'Fechado') {
          
          if (fornecedor == 'totvs') {
            this.totvs_status_fechado = true
          }else if (fornecedor == 'uBrasil') {
            this.uBrasil_status_fechado = true
          }else if (fornecedor == 'plusoft') {
            this.plusoft_status_fechado = true
          }else if (fornecedor == 'projuris') {
            this.projuris_status_fechado = true
          }else if (fornecedor == 'nekit') {
            this.nekit_status_fechado = true
          }else if (fornecedor == 'penso') {
            this.penso_status_fechado = true
          }

        }else{
          if (fornecedor == 'totvs') {
            this.totvs_status_fechado = false
          }else if (fornecedor == 'uBrasil') {
            this.uBrasil_status_fechado = false
          }else if (fornecedor == 'plusoft') {
            this.plusoft_status_fechado = false
          }else if (fornecedor == 'projuris') {
            this.projuris_status_fechado = false
          }else if (fornecedor == 'nekit') {
            this.nekit_status_fechado = false
          }else if (fornecedor == 'penso') {
            this.penso_status_fechado = false
          }
        }
      },
      async alteraAba(index,statusDB, fornecedor){
        
        const id_status = `#status-${fornecedor}${index}`;
        const status = await this.statusFornecedorDB(id_status, fornecedor);
        
        //qualquer clique em num_ticket e o valor do select é igual ao db
        if (statusDB === status) {
          if (status !== 'Fechado') {
            this.t_status_fechado = false; 
            //nao mostrar os campos de fechado quando por exemplo, o pendente no select é igual pendente no db
            //se for fechado em ambos, já tem uma logica na div para mostrar se o status no db é fechado
          };

          this.f_status_change_icon = false; //se os status são iguais, não mostro o botao salvar
        }else{

          this.f_status_change_icon = true; //mostro o icone caso sejam diferentes os status

          if (status === 'Fechado') {
            //mostro os campos de versao futura e data fechado se o status selecionado no select
            //for fechado e diferente do db
            this.t_status_fechado = true;
          }else{
            //se for diferente do db e não for fechado, não mostro
            this.t_status_fechado = false;
          }
        }
        
      },
      cleanFieldsFornecedor(){
        this.model_fornecedor = 'Selecione fornecedor...';
        this.t_nr_ticket = '';
        this.t_status = '';
        $("#impede").val('nao');
        $("#titulo-fornecedor").val('');

      },
      aba_fornecedor(fornecedor){ 
        if (fornecedor === 1) { //totvs
          if (this.totvs !== []){
            const existe = this.totvs.find(ticket => ticket.num_chamado.trim() === this.chamadoMoreInfo.trim());
            return existe == undefined ? false :  true
          }
        } else if (fornecedor === 2) { //Unimed do Brasil
          if (this.uBrasil !== []){
            const existe = this.uBrasil.find(ticket => ticket.num_chamado.trim() === this.chamadoMoreInfo.trim());
            return existe == undefined ? false :  true
          }
        } else if (fornecedor === 3) { //Plusoft
          if (this.plusoft !== []){
            const existe = this.plusoft.find(ticket => ticket.num_chamado.trim() === this.chamadoMoreInfo.trim());
            return existe == undefined ? false :  true
          }
        } else if (fornecedor === 4) { //Projuris
          if (this.projuris !== []){
            const existe = this.projuris.find(ticket => ticket.num_chamado.trim() === this.chamadoMoreInfo.trim());
            return existe == undefined ? false :  true
          }
        } else if (fornecedor === 5) { //Nekit
          if (this.nekit !== []){
            const existe = this.nekit.find(ticket => ticket.num_chamado.trim() === this.chamadoMoreInfo.trim());
            return existe == undefined ? false :  true
          }
        } else if (fornecedor === 6) { //Penso
          if (this.penso !== []){
            const existe = this.penso.find(ticket => ticket.num_chamado.trim() === this.chamadoMoreInfo.trim());
            return existe == undefined ? false :  true
          }
        }
        
      },
      get_id_fornecedor(fornecedor){
        let id_fornecedor = '';
        if (fornecedor == 'totvs') {
          id_fornecedor = '1';
        } else if (fornecedor == 'uBrasil') {
          id_fornecedor = '2';
        } else if (fornecedor == 'plusoft') {
          id_fornecedor = '3';
        } else if (fornecedor == 'projuris') {
          id_fornecedor = '4';
        }else if (fornecedor == 'nekit') {
          id_fornecedor = '5';
        }else if (fornecedor == 'penso') {
          id_fornecedor = '6';
        };
        return id_fornecedor;
      },
      async createTicket(id_chamado,num_chamado,fornecedor,categoria, nome_solicitante){
        
        this.LoadIncluiExcluiTicket = true;

        let field = '',dt_abertura = '',num_ticket = '',titulo = '',status = '',versao = '';
        let impede = false,create = false;
        let versao_futura = '';
        let incluiTextoChamado = '',incluiTextoChamadoInvisivel = '';

        if ($('#incluirTextoTicket:checked').val() == 'checked') {
          incluiTextoChamado = true;
        }else {
          incluiTextoChamado = false;
        };
        if ($('#incluirInvisivelTicket:checked').val() == 'checked') {
          incluiTextoChamadoInvisivel = true;
        }else {
          incluiTextoChamadoInvisivel = false;
        };
  
        dt_abertura = $("#dt-abertura-fornecedor").val();
        num_ticket = $("#chamado-fornecedor").val().trim();
        titulo = $("#titulo-fornecedor").val();
        
        //*=====================================status=============================================
        status = await this.statusFornecedorDB('#status-fornecedor', fornecedor);
        
        //*==================================check_empty=============================================
        if (dt_abertura == '') {
          field += ' Dt. Abertura;';
        };
        if (num_ticket == '') {
          field += ' Ticket;';
        };
        if (titulo == '') {
          field += ' Titulo;';
        };
        if (status == '') {
          field += ' Status;';
        };
        //*=====================================totvs================================================
        const id_fornecedor = this.get_id_fornecedor(fornecedor.trim());
        if (fornecedor == 'totvs') {
          impede = $("#impede").val() == 'nao' ? 'false' : 'true';
          versao = $("#versao-totvs").val();
          versao_futura = $("#versao_futura").val();

          if (impede == '') {
            field += ' Impede Atualização?;';
          };
          if (versao == '') {
            field += ' Versão;';
          };
          if (status == 'Fechado') {
            if (versao_futura == '') {
              field += ' Versão Futura. Coloque "N/A" se não tiver versão futura \nEx: Chamado de dúvida..';
            }
          };
        };

        if (field == '') {
          create = true;
        } else{
          this.notification(`Obrigatório preencher: ${field}`,'error','PREENCHA TODOS OS CAMPOS');
        };

        const data = {id_chamado,id_fornecedor,num_chamado,dt_abertura,num_ticket,categoria,impede,
                      titulo,status,versao,versao_futura,incluiTextoChamado,
                      incluiTextoChamadoInvisivel, nome_solicitante};

        if (create) {
          try {
            let res = await ChamadosService.createTicket(data);

            if (res !== true) {
              //se não for true, mostra o erro:
              this.notification(res)
              console.log(res);
            }else{
              //para chamar o computed do fornecedor e recarregar os dados
              if (id_fornecedor.trim() == '1') {
                this.incluidoExcluidoTotvs = 'create';
              } else if (id_fornecedor.trim() == '2') {
                this.incluidoExcluidoUBrasil = 'create';
              } else if (id_fornecedor.trim() == '3') {
                this.incluidoExcluidoPlusoft = 'create';
              } else if (id_fornecedor.trim() == '4') {
                this.incluidoExcluidoProjuris = 'create';
              } else if (id_fornecedor.trim() == '5') {
                this.incluidoExcluidoNekit = 'create';
              } else if (id_fornecedor.trim() == '6') {
                this.incluidoExcluidoPenso = 'create';
              };
              /* const resFolder = await this.createFolderFornecedor(num_chamado,num_ticket,titulo,dt_abertura,id_fornecedor); */

              this.totvs_status_fechado = false
              this.uBrasil_status_fechado = false
              this.plusoft_status_fechado = false
              this.projuris_status_fechado = false
              this.nekit_status_fechado = false
              this.penso_status_fechado = false

              this.notification('Ticket criado com sucesso','success')
            }
          } catch (error) {
            const erro = `Erro 064: ${error}`
            this.notification(erro);
            console.log(erro);
            this.LoadIncluiExcluiTicket = false;
          };
        };
      },
      async deleteTicket(num_chamado,num_ticket,id_fornecedor){
        //esse confirm abre um alert, se eu clicar em OK a resposta será true e cancelar será false
        this.LoadIncluiExcluiTicket = true; //finalizo lá no computed
        let res = confirm(`Tem certeza que deseja excluir o ticket ${num_ticket.trim()} do chamado ${num_chamado}`);
        if (res == true) {
           try {
             const ticket = {
               num_chamado,num_ticket,id_fornecedor
             }             
            await ChamadosService.deleteTicket(ticket);

            //para chamar o computed do fornecedor e recarregar os dados
            if (id_fornecedor.trim() == '1') {
              this.incluidoExcluidoTotvs = 'delete';
            } else if (id_fornecedor.trim() == '2') {
              this.incluidoExcluidoUBrasil = 'delete';
            } else if (id_fornecedor.trim() == '3') {
              this.incluidoExcluidoPlusoft = 'delete';
            } else if (id_fornecedor.trim() == '4') {
              this.incluidoExcluidoProjuris = 'delete';
            } else if (id_fornecedor.trim() == '5') {
              this.incluidoExcluidoNekit = 'delete';
            } else if (id_fornecedor.trim() == '6') {
              this.incluidoExcluidoPenso = 'delete';
            }
          } catch (error) {
            const erro = `Erro 065: ${error}`
            this.notification(erro);
            console.log(erro);
            this.LoadIncluiExcluiTicket = false;
          } 
        }else{
          //if the button cancel is clicked
          this.LoadIncluiExcluiTicket = false;
        }
      },
      async deleteGmud(gmud_number, chamado_number){
        //esse confirm abre um alert, se eu clicar em OK a resposta será true e cancelar será false
        let res = confirm(`Tem certeza que deseja excluir a gmud ${gmud_number} do chamado ${chamado_number}`);
        if (res == true) {
        this.LoadIncluiExcluiGmud = true;  //finalizo lá no computed
          try {
            await ChamadosService.deleteGmud(gmud_number, chamado_number);
            //o computed gmudChamadoSelected será chamado pois this.incluidoExcluidoGmud está lá, e lá chamará gmudFromServer
            this.incluidoExcluidoGmud = true;

          } catch (err) {
            console.log(`erro ao chamar o ChamadosService.deleteGmud: ${err}`);
            this.LoadIncluiExcluiGmud = false;
          }
        }else{
          //if cancel button is clicked
          this.LoadIncluiExcluiGmud = false;
        }
        
      },
      async createGmud(gmud_number, chamado_number) {
        this.LoadIncluiExcluiGmud = true; //finalizo lá no computed

        if (gmud_number == null || gmud_number == '') {
          alert('Por favor, preencha o campo Nº Gmud');
          this.LoadIncluiExcluiGmud = false;
        }else{
          try {
            
            const resCreateGmud = await ChamadosService.createGmud(gmud_number, chamado_number);
            
            //se resposta for diferente de true, então será uma string com a mensagem de erro/alerta
            if (resCreateGmud !== true) {
              this.notification(resCreateGmud);     
              this.LoadIncluiExcluiGmud = false;         
            } else{              
              //só altero essa variável se não der erro, daí ele vai chamar os dados no server, pois se não deu erro, será incluído..
              //o computed gmudChamadoSelected será chamado pois this.incluidoExcluidoGmud está lá, e lá chamará gmudFromServer 
              this.incluidoExcluidoGmud = true;
            };
                
          } catch (err) {
            this.notification(err);
          };
        };

      },
      async createFolderCopyPath(chamado_number){

        const chamado_value = chamado_number.replace('/','+')
        const resCreateFolder = await ChamadosService.createFolder(chamado_value)
        
        const message_type = resCreateFolder.indexOf('Erro ');

        if (message_type === 0) {
          this.notification(resCreateFolder);
        }else{
          this.notification(resCreateFolder,'success','Copiado com sucesso');
        }

        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = resCreateFolder;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
      },
      notification(mensagem,msg_type,title){
        /*ESSA FUNCÃO TB TEM EM OUTROS LUGARES, ALTERAR EM TODOS
          MeusGrupos.vue
          Register.vue
          Login.vue
        */

        //para erro e alerta, não precisa mandar o msg_type
        let notify_type = '';
        let title_type = '';
        
        if (msg_type == 'success') {
          notify_type = 'success';
          title_type = (title == '' || title == null || title == undefined) ? 'SUCESSO' : title;
        }else if (mensagem.indexOf('Alerta ') == 0 || msg_type == 'warn') {
          //eu crio algumas msgs de alerta, por isso pesquiso por elas aqui
          notify_type = 'warn';
          title_type = (title == '' || title == null || title == undefined) ? 'ATENÇÃO' : title;
        }else {
          //se não for alerta nem success, coloco como erro
          notify_type = 'error';
          title_type = (title == '' || title == null || title == undefined) ? 'ERRO' : title;
        }
        //to read about notify  (https://www.npmjs.com/package/vue-notification)
        this.$notify({
          group: 'notification',
          title: `${title_type}!!!`,
          text: mensagem,
          type: notify_type,
        });
      },
      icon_class(status){
        return {'icon-aberto': (status == 'Em aberto' || status == 'Alterado pelo solicitante'),
             'icon-andamento': (status == 'Em andamento'),
          'icon-especialista': (status == 'Aguardando especialista'),
               'icon-fechado': (status == 'Fechado' || status == 'Fechado pelo solicitante'),
                  'icon-gmud': (status == 'Aguardando GMUD'),
            'icon-fornecedor': (status == 'Aguardando fornecedor'),
          'icon-somente-fornecedor': (status == 'Somente fornecedor'),
             'icon-resolvido': (status == 'Resolvido' || status == 'Aprovada'),
               'icon-pausado': (status == 'Pausado'),
           'icon-solicitante': (status == 'Aguardando solicitante'),
               'pronta-iniciar': (status == 'Pronta para iniciar'),
                  'icon-gmud': (status == 'Iniciada'),}
      },
      status_class(status){
        return {'status-aberto': (status == 'Em aberto' || status == 'Alterado pelo solicitante'),
             'status-andamento': (status == 'Em andamento'),
          'status-especialista': (status == 'Aguardando especialista'),
               'status-fechado': (status == 'Fechado' || status == 'Fechado pelo solicitante'),
                  'status-gmud': (status == 'Aguardando GMUD'),
            'status-fornecedor': (status == 'Aguardando fornecedor'),
          'status-somente-fornecedor': (status == 'Somente fornecedor'),
             'status-resolvido': (status == 'Resolvido' || status == 'Aprovada'),
               'status-pausado': (status == 'Pausado'),
           'status-solicitante': (status == 'Aguardando solicitante'),
               'pronta-iniciar': (status == 'Pronta para iniciar'),
                  'status-gmud': (status == 'Iniciada'),}
      },
      status_class_fornecedor(status, id){
        let fornecedor = '';
        if (id.trim() == '1') {
          fornecedor = 'totvs'
        }else if (id.trim() == '2') {
          fornecedor = 'uBrasil'
        }else if (id.trim() == '3') {
          fornecedor = 'plusoft'
        }else if (id.trim() == '4') {
          fornecedor = 'projuris'
        }else if (id.trim() == '5') {
          fornecedor = 'nekit'
        }else if (id.trim() == '6') {
          fornecedor = 'penso'
        };       

        return {'status-aberto': (status.trim() == 'Pendente fesp'),
             'status-andamento': (status.trim() == `Pendente ${fornecedor}`),
               'status-fechado': (status.trim() == 'Fechado')}
      },
      async getNewChamado(chamado_number){
        this.chamadoMoreInfo = chamado_number;
        this.model_fornecedor = 'Selecione fornecedor...';
      },
      async tableExpand(chamado_number){     
        if (this.LoadSyncTopDesk) {
          this.notification('A sincronização em andamento, aguarde!', 'warn');
          return
        }
        this.tableExpanded = !this.tableExpanded
        this.tableWidht = !this.tableWidht
        this.chamadoMoreInfo = chamado_number;
        this.cleanFieldsFornecedor();
      },
      goToLink(url) {
        window.open(url, "_blank");
      },
      saveModalStatusId(numChamado, titulo, id_chamado) {
        $('#selectedOptionStatus').val('Selecione um status...');
        this.dataChamadoNumber = numChamado;
        this.dataId = id_chamado;
        this.dataTitulo = titulo;
      },
      async updateStatusServer() {

        this.LoadUpdateStatus = true;

        this.dataStatus = $("#selectedOptionStatus").val();
        if (this.dataStatus == 'Selecione um status...') {
          alert('Por favor, selecione um novo status')
        }else{
          try {              
            const data = {
                num_chamado: this.dataChamadoNumber,
                id_chamado: this.dataId,
                status: this.dataStatus
            };
            const alteraTopdeskDatabase = await ChamadosService.updateStatus(data);
            
            if (alteraTopdeskDatabase.data !== true && alteraTopdeskDatabase !== 'true') {
              if (alteraTopdeskDatabase.data.indexOf('Erro') == 0) {
                  this.notification(alteraTopdeskDatabase.data);
                  $('#modalChangeStatus').modal('hide'); 
                  this.LoadUpdateStatus = false;
              };
            }else{
              //esticar a tabela antes de destruir
              
              var expandido = false;
              if (!this.tableExpanded) {
                this.tableExpanded = !this.tableExpanded
                this.tableWidht = !this.tableWidht
                expandido = true;
              };
              $("#tableTickets").DataTable().destroy(); //to ajust datatable sort

              await this.getDataFromServer({  
                table: 'chamado' ,closed: '', whereTable: '', 
                whereField: '', whereValue:  '', sync: false, clearStorage: true
              });
              
              await this.configDataTable();
              
              $('#modalChangeStatus').modal('hide');
              
              this.notification('Atualizado com sucesso','success');
            };
            
            } catch (error) {
              this.error = `Erro 058 - ${error.message}`;
              console.log(this.error);
              $('#modalChangeStatus').modal('hide');    
              this.LoadUpdateStatus = false;
          };
        };
        this.LoadUpdateStatus = false;
      }, 
      async getChamadoGmudTicket(table, sync){
        
        let sendData = '';
        sendData = {  
          table: table,
          closed: '', whereTable: '', whereField: '', whereValue:  '', sync: sync,
        };
        await this.getDataFromServer(sendData);

        //para recarregar os index's e não dar problema em qual está selecionado
        sendData = {  
          table: 'chamado',
          closed: '', whereTable: '', whereField: '', whereValue:  '', sync: sync,
        };
        await this.getDataFromServer(sendData); 
      },
      async carregarChamados(){

        const sendData = {  
          table: 'chamado',
          closed: '', whereTable: '', whereField: '', whereValue:  '', sync: false,
          clearStorage: true
        };
        //2º parameter(true) is used in ChamadosService
        $("#tableTickets").DataTable().destroy(); //to ajust datatable sort
        await this.getDataFromServer(sendData);
        await this.configDataTable();

        this.notification('Atualizado com sucesso','success');
      },
      async syncDataTopDesk(){
        //verificar se tem outro processo em andamento
        if (this.initialLoad) {
          this.notification('Espere acabar a leitura inicial de chamados', 'warn');
        }else if (this.LoadUpdateStatus) {
          this.notification('Espere acabar o Update do Status', 'warn');
        }else if (this.LoadSyncTopDesk) {
          this.notification('A sincronização já foi iniciada, aguarde!', 'warn');
          return
        }else if (this.LoadIncluiExcluiTicket) {
          this.notification('Espere acabar o Update do Status', 'warn');
        }else if (this.loadChangeStatusFornecedor) {
          this.notification('Espere acabar o Update do Status', 'warn');
        }else if (this.LoadIncluiExcluiGmud) {
          this.notification('Espere acabar o Update do Status', 'warn');
        }else if (this.LoadCarregarChamados) {
          this.notification('Espere carregar os Chamados', 'warn');
        }else {
          this.LoadSyncTopDesk = true;

          //passar o operador que está fazendo a sincronização, se existir
          if (this.login_rede_user_logged !== null && this.login_rede_user_logged !== undefined) {
            const res = await ChamadosService.syncDataTopDesk(this.login_rede_user_logged, this.input_syncTopdesk ? this.input_syncTopdesk : '0');
            if (res[0] !== true) {
              if (res[0].indexOf('Erro') == 0) {
                this.notification(res[0]);
              }
            }else{
              //esticar a tabela antes de destruir
              if (!this.tableExpanded) {
                this.tableExpanded = !this.tableExpanded
                this.tableWidht = !this.tableWidht
              };
              $("#tableTickets").DataTable().destroy(); //to ajust datatable sort

              await this.getDataFromServer({  
                  table: 'chamado' ,closed: true, whereTable: '', whereField: '', 
                  whereValue:  '', sync: false, clearStorage: true
              });
              await this.getDataFromServer({  
                  table: 'ticket' ,closed: true, whereTable: '', whereField: '',
                  whereValue:  '', sync: false
              });
              await this.getDataFromServer({  
                  table: 'gmud' ,closed: true, whereTable: '', whereField: '', 
                  whereValue:  '', sync: false,
              });
            
              await this.configDataTable();

              this.notification('Atualizado com sucesso','success');
            };

          }else{
            this.notification('Não há chamados para sincronizar','warn');
          };
        };
        this.input_syncTopdesk = '';
        this.LoadSyncTopDesk = false;
      },
      async getDataFromServer(data) {
        try {          
          await this.$store.dispatch('getDataFromServer', data);
        
          const erro = this.$store.getters.error;
          if (erro !== null) {
            this.notification(erro);
          }else{          
            if (this.$route.fullPath == '/') {
                this.chamados = this.$store.getters.openChamados;  //somente chamados abertos
            }else if (this.$route.fullPath == '/allTickets') {
                this.chamados = this.$store.getters.allChamados;  // todos os chamados
            };
            
            this.login_rede_user_logged = this.chamados[0] == null || this.chamados[0] == undefined ? '' : this.chamados[0].o_login

            this.fornecedores = this.$store.getters.fornecedor;
            //console.log(this.fornecedores );
            for (let i = 0; i < this.fornecedores.length; i++) {  
              if (this.fornecedores[i].id_fornecedor.trim() == '1') {
                this.totvs_open = this.fornecedores[i].link_open_ticket;
              }else if (this.fornecedores[i].id_fornecedor.trim() == '2') {
                this.uBrasil_open = this.fornecedores[i].link_open_ticket;
              }else if (this.fornecedores[i].id_fornecedor.trim() == '3') {
                this.plusoft_open = this.fornecedores[i].link_open_ticket;
              }else if (this.fornecedores[i].id_fornecedor.trim() == '4') {
                this.projuris_open = this.fornecedores[i].link_open_ticket;
              }else if (this.fornecedores[i].id_fornecedor.trim() == '5') {
                this.nekit_open = this.fornecedores[i].link_open_ticket;
              }else if (this.fornecedores[i].id_fornecedor.trim() == '6') {
                this.penso_open = this.fornecedores[i].link_open_ticket;
              };
            };
            
            this.gmuds = this.$store.getters.gmuds;
            this.tickets = this.$store.getters.tickets;
            
            this.totvs = [];
            this.uBrasil = [];
            this.plusoft = [];
            this.projuris = [];
            this.nekit = [];
            this.penso = [];

            for (let i = 0; i < this.tickets.length; i++) {
              if (this.tickets[i].id_fornecedor.trim() == '1') { //totvs
                this.totvs.push(this.tickets[i]);
              };
              if (this.tickets[i].id_fornecedor.trim() == '2') { //uBrasil
                this.uBrasil.push(this.tickets[i]);
              };
              if (this.tickets[i].id_fornecedor.trim() == '3') { //plusoft
                this.plusoft.push(this.tickets[i]);
              };
              if (this.tickets[i].id_fornecedor.trim() == '4') { //projuris
                this.projuris.push(this.tickets[i]);
              };
              if (this.tickets[i].id_fornecedor.trim() == '5') { //nekit
                this.nekit.push(this.tickets[i]);
              };
              if (this.tickets[i].id_fornecedor.trim() == '6') { //penso
                this.penso.push(this.tickets[i]);
              };
            };
          };
        
        } catch (error) {
          
          if (error.message !== null && error.message !== undefined) {
            this.error = error.message;
            console.log(`Erro 022: ${this.error}`);
          }else {
            this.error = error;
            console.log(`${this.error}`);
          }
          this.notification(this.error);
        }
      },
      async configDataTable() {
        
        /* Para colocar o datatable na table*/
        $(document).ready(function() {
          $.fn.dataTable.moment('DD/MM/YYYY');
          $("#tableTickets").DataTable({
            pageLength: 15, //inicia com o filtro de 10 chamados
            lengthMenu: [[5, 10, 15, 20, 30, -1], [5, 10, 15, 20, 30, "All"]], //possibilidades de filtros
            dom: '<"top"lf>rt<"bottom"ip>',
            columnDefs: [
              {
                targets: 'no-sort',
                orderable: false,
                targets: [0, 5],
              },
            ],

            order: [[1, "asc"]], //to sort by default the column num_chamado
            language: {
              lengthMenu: "Mostrar _MENU_ por página",
              zeroRecords: "Não encontrado - verifique sua busca",
              info: "_MAX_ registros",
              infoEmpty: "Nenhum registro disponível",
              infoFiltered: "(Filtrado _END_)",
              search: "Pesquisar",
              paginate: {
                previous: "Anterior",
                next: "Próximo"
              },
              search: "_INPUT_",
              searchPlaceholder: "Pesquisar..."
            }
          });
          //to button of pagination stay small
          $('#tableTickets_paginate').addClass('pagination-sm');
          
          $('#tableTickets_info').css({"font-size": "14px"});
          $('#tableTickets_length').css({"font-size": "15px"});
          $('.dataTables_filter input[type="search"]').css({
            width: "180px",
            cursor: "auto"
          });
          /* css para div que contem o input search e numero de listas */
          $(".top").css({
            display: "flex",
            "justify-content": "space-between",
            padding: "5px 0px"
          });
          /* css para paginação da tabela */
          $(".bottom").css({
            "display": "flex",
            "justify-content": "space-between",
            "padding-top": "15px",
            "padding-bottom": "20px"
          });
        });
      },
    }
  };
</script>

<style scoped src="./style.css"></style>

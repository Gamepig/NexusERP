@extends('layouts.app')

@section('content')
  <div class="max-w-4xl mx-auto p-6 space-y-6">
    <x-ui.alert variant="info" title="Design System OK">
      Tokens 與基本組件已載入，以下示範 Card / Button / Modal / FormRow。
    </x-ui.alert>

    <x-ui.card title="Card 樣式" subtitle="使用 nexus-card 與 tokens">
      <p>這是一個示範卡片內容。背景、文字、邊框、陰影來自 design tokens。</p>
      <x-slot:footer>
        <x-ui.button>Primary</x-ui.button>
        <x-ui.button variant="secondary" class="ml-2">Secondary</x-ui.button>
        <x-ui.button variant="outline" class="ml-2">Outline</x-ui.button>
      </x-slot:footer>
    </x-ui.card>

    <x-ui.card title="FormRow 與 Input">
      <x-ui.form-row label="名稱" for="name" required help="請輸入名稱">
        <x-ui.input id="name" name="name" />
      </x-ui.form-row>
      <x-ui.form-row label="類型" for="type">
        <x-ui.select id="type" name="type">
          <option>Type A</option>
          <option>Type B</option>
        </x-ui.select>
      </x-ui.form-row>
    </x-ui.card>

    <x-ui.card title="Modal">
      <x-ui.modal>
        <x-slot:trigger>
          <x-ui.button>開啟 Modal</x-ui.button>
        </x-slot:trigger>
        <p>這是 Modal 內容。</p>
      </x-ui.modal>
    </x-ui.card>

    <x-ui.card title="Dropdown">
      <x-dropdown>
        <x-slot name="trigger">
          <x-ui.button>開啟下拉</x-ui.button>
        </x-slot>
        <x-slot name="content">
          <ul class="nexus-dropdown-list">
            <li class="nexus-dropdown-item">項目 A</li>
            <li class="nexus-dropdown-item">項目 B</li>
            <li class="nexus-dropdown-item">項目 C</li>
          </ul>
        </x-slot>
      </x-dropdown>
    </x-ui.card>
  </div>
@endsection



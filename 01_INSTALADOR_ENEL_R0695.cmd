@echo off
setlocal
set "ARMA_R0695_SELF=%~f0"
echo A.R.M.A. ENEL R069.5 - REPARACION DPAPI Y PUENTE LOCAL
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "$t=[IO.File]::ReadAllText($env:ARMA_R0695_SELF,[Text.Encoding]::UTF8);$m='REM_ARMA_R0695_POWERSHELL_PAYLOAD_START';$i=$t.LastIndexOf($m);if($i -lt 0){throw 'PAYLOAD_NO_ENCONTRADO'};$s=$t.Substring($i+$m.Length).TrimStart([char]13,[char]10);$f=Join-Path $env:TEMP ('ARMA_R0695_'+[Guid]::NewGuid().ToString('N')+'.ps1');[IO.File]::WriteAllText($f,$s,(New-Object Text.UTF8Encoding($true)));try{& $f -Modo InstalarYClave;if($LASTEXITCODE -ne 0){exit 1}}finally{Remove-Item -LiteralPath $f -Force -ErrorAction SilentlyContinue}"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" echo ERROR AL INSTALAR O ACTUALIZAR. REVISAR MENSAJE SUPERIOR.
echo.
pause
exit /b %RC%
REM_ARMA_R0695_POWERSHELL_PAYLOAD_START
# A.R.D.A.N. R069.5 hotfix de cambio de clave sobre agente local R069.4.
# Sin puertos entrantes; no almacena credenciales en web, Drive ni GitHub.
[CmdletBinding()]
param([ValidateSet('InstalarYClave','Clave','Manual','Activar','Deshabilitar','Estado')][string]$Modo='Clave', [switch]$DesdeNavegador)
$ErrorActionPreference='Stop'
$raiz='C:\ARMA_ENEL_R046'
$appDir=Join-Path $env:LOCALAPPDATA 'ARMA_ENEL_R0694'
$dest=Join-Path $appDir 'ARMA_ENEL_R0694_Agente_Local.ps1'
$vault=Join-Path $env:LOCALAPPDATA 'ARMA_ENEL_R046\secrets\enel_credencial.dpapi'
$tarea='ARMA_ENEL_R065_DIARIO'

function Mensaje([string]$s,[string]$color='Cyan'){Write-Host $s -ForegroundColor $color}
function Confirmar([string]$texto,[string]$esperado='SI'){
  return ((Read-Host ($texto+' [escriba '+$esperado+']')) -ceq $esperado)
}
function Instalar-Puente {
  [IO.Directory]::CreateDirectory($appDir)|Out-Null
  if(!(Test-Path -LiteralPath $PSCommandPath)){throw 'INSTALADOR_NO_ENCONTRADO'}
  if($PSCommandPath -ne $dest){Copy-Item -LiteralPath $PSCommandPath -Destination $dest -Force}
  $psexe=Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
  if(!(Test-Path -LiteralPath $psexe)){throw 'POWERSHELL_5_1_NO_EXISTE'}
  $acciones=@{
    'arma-enel-r0693-clave'='Clave'
    'arma-enel-r0693-manual'='Manual'
    'arma-enel-r0693-activar'='Activar'
    'arma-enel-r0693-desactivar'='Deshabilitar'
    'arma-enel-r0693-estado'='Estado'
  }
  foreach($scheme in ($acciones.Keys|Sort-Object)) {
    $reg='HKCU:\Software\Classes\'+$scheme
    if(Test-Path -LiteralPath $reg){
      $cmdKey=Join-Path $reg 'shell\open\command'
      $prev=''
      if(Test-Path -LiteralPath $cmdKey){$prev=[string](Get-Item -LiteralPath $cmdKey).GetValue('')}
      if($prev -and $prev -notmatch 'ENEL_R0693_Accion_Local\.ps1|ARMA_ENEL_R0694_Agente_Local\.ps1'){
        throw ('PROTOCOLO_DESCONOCIDO_NO_REEMPLAZADO: '+$scheme)
      }
      $respaldo=Join-Path $appDir ($scheme+'_antes_'+(Get-Date -Format yyyyMMdd_HHmmss)+'.reg')
      & reg.exe export ('HKCU\Software\Classes\'+$scheme) $respaldo /y | Out-Null
      if($LASTEXITCODE -ne 0){throw ('FALLO_RESPALDO_REGISTRO_'+$scheme)}
    }
    New-Item -Path $reg -Force|Out-Null
    Set-Item -Path $reg -Value ('URL:ARMA ENEL R0695 '+$acciones[$scheme])
    New-ItemProperty -Path $reg -Name 'URL Protocol' -PropertyType String -Value '' -Force|Out-Null
    $commandKey=Join-Path $reg 'shell\open\command'
    New-Item -Path $commandKey -Force|Out-Null
    # Sin %1: la pagina no puede inyectar argumentos, claves ni comandos al sistema.
    $cmd='"'+$psexe+'" -NoProfile -ExecutionPolicy Bypass -File "'+$dest+'" -Modo '+$acciones[$scheme]+' -DesdeNavegador'
    Set-Item -Path $commandKey -Value $cmd
    if([string](Get-Item -LiteralPath $commandKey).GetValue('') -cne $cmd){throw ('ERROR_VALIDANDO_REGISTRO_'+$scheme)}
    Mensaje ('INSTALADO PROTOCOLO: '+$scheme) 'Green'
  }
  Mensaje 'INSTALACION COMPLETA BAJO ESTA CUENTA WINDOWS.' 'Green'
  Mensaje 'Protocolo manual R052 preexistente: NO SE MODIFICO.'
  Mensaje ('Componente local: '+$dest)
}
function Guardar-DPAPI {
  # R069.5: mantener formato R046 (JSON DPAPI CurrentUser) sin invocar el guardador antiguo.
  # En el R046 original fallaba System.IO.File.Replace; esta version usa copia temporal
  # con respaldo y validacion DPAPI de lectura, y rollback en caso de error.
  if($env:OS -ne 'Windows_NT'){throw 'SOLO_WINDOWS'}
  Add-Type -AssemblyName System.Security
  if([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)){throw 'LOCALAPPDATA_NO_DEFINIDO'}
  $dir=Split-Path -Parent $vault
  [IO.Directory]::CreateDirectory($dir)|Out-Null
  $old=Test-Path -LiteralPath $vault -PathType Leaf
  Mensaje ('Cuenta Windows: '+[Security.Principal.WindowsIdentity]::GetCurrent().Name)
  Mensaje 'La credencial sera guardada SOLO en el perfil local de este usuario Windows.'
  if(-not(Confirmar '¿La nueva clave YA permite entrar al portal oficial ENEL?')){
    Mensaje 'SIN CAMBIOS: primero modificar y comprobar la clave en portal ENEL.' 'Yellow'
    return
  }
  $usuario=Read-Host 'Usuario o correo ENEL'
  if([string]::IsNullOrWhiteSpace($usuario)){throw 'USUARIO_ENEL_VACIO'}
  $seg=Read-Host 'Clave ENEL vigente (oculta)' -AsSecureString
  if($null -eq $seg -or $seg.Length -eq 0){throw 'CLAVE_ENEL_VACIA'}
  $ptr=[IntPtr]::Zero; $plain=$null; $json=$null; $bytes=$null; $cipher=$null; $temp=$null; $backup=$null
  try {
    $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
    $sys=[Security.Principal.SecurityIdentifier]::new('S-1-5-18')
    $acl=New-Object Security.AccessControl.DirectorySecurity
    $acl.SetAccessRuleProtection($true,$false)
    $flags=[Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
    $alc=[Security.AccessControl.AccessControlType]::Allow
    $rights=[Security.AccessControl.FileSystemRights]::FullControl
    $acl.AddAccessRule(([Security.AccessControl.FileSystemAccessRule]::new($sid,$rights,$flags,[Security.AccessControl.PropagationFlags]::None,$alc)))
    $acl.AddAccessRule(([Security.AccessControl.FileSystemAccessRule]::new($sys,$rights,$flags,[Security.AccessControl.PropagationFlags]::None,$alc)))
    [IO.Directory]::SetAccessControl($dir,$acl)

    $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($seg)
    $plain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    $json=ConvertTo-Json -InputObject @{usuario=$usuario;password=$plain} -Compress
    $bytes=[Text.Encoding]::UTF8.GetBytes($json)
    $cipher=[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
    $temp=Join-Path $dir ('cred_r0695_'+[Guid]::NewGuid().ToString('N')+'.tmp')
    [IO.File]::WriteAllBytes($temp,$cipher)
    # Validacion PREVIA de los bytes cifrados, sin mostrar secretos.
    $testBytes=$null
    try {
      $testBytes=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($temp),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
      $o=ConvertFrom-Json -InputObject ([Text.Encoding]::UTF8.GetString($testBytes))
      if([string]$o.usuario -cne $usuario -or [string]::IsNullOrWhiteSpace([string]$o.password)){throw 'CONTENIDO_DPAPI_INVALIDO'}
    } finally {if($testBytes){[Array]::Clear($testBytes,0,$testBytes.Length)}}
    if($old){
      $backup=Join-Path $dir ('enel_credencial_respaldo_r0695_'+(Get-Date -Format 'yyyyMMdd_HHmmss')+'_'+[Guid]::NewGuid().ToString('N')+'.dpapi.bak')
      [IO.File]::Copy($vault,$backup,$false)
      Mensaje 'Respaldo de credencial anterior realizado (DPAPI cifrado).' 'Yellow'
    }
    $committed=$false
    try {
      # Evitar File.Replace: fue el punto de fallo en R046 / R069.4.
      # El archivo anterior ya cuenta con respaldo dentro del mismo directorio protegido.
      [IO.File]::Copy($temp,$vault,$true)
      $fileAcl=New-Object Security.AccessControl.FileSecurity
      $fileAcl.SetAccessRuleProtection($true,$false)
      $fileAcl.AddAccessRule(([Security.AccessControl.FileSystemAccessRule]::new($sid,$rights,$alc)))
      $fileAcl.AddAccessRule(([Security.AccessControl.FileSystemAccessRule]::new($sys,$rights,$alc)))
      [IO.File]::SetAccessControl($vault,$fileAcl)
      $readBytes=$null
      try {
        $readBytes=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($vault),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
        $v=ConvertFrom-Json -InputObject ([Text.Encoding]::UTF8.GetString($readBytes))
        if([string]$v.usuario -cne $usuario -or [string]::IsNullOrWhiteSpace([string]$v.password)){throw 'VERIFICACION_POSTERIOR_FALLO'}
      } finally {if($readBytes){[Array]::Clear($readBytes,0,$readBytes.Length)}}
      $committed=$true
    } finally {
      if(-not $committed){
        if($old -and $backup -and [IO.File]::Exists($backup)){
          [IO.File]::Copy($backup,$vault,$true)
          Mensaje 'ROLLBACK: se restauro la credencial anterior cifrada.' 'Yellow'
        } elseif(-not $old -and [IO.File]::Exists($vault)){
          [IO.File]::Delete($vault)
        }
      }
    }
    Mensaje 'OK R069.5: DPAPI ACTUALIZADO Y VERIFICADO EN ESTA CUENTA WINDOWS.' 'Green'
    Mensaje 'Ahora ejecuta la DESCARGA MANUAL R052 y confirma la recepcion en ARMA.' 'Green'
  } finally {
    if($ptr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
    if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}
    if($cipher){[Array]::Clear($cipher,0,$cipher.Length)}
    if($temp -and [IO.File]::Exists($temp)){[IO.File]::Delete($temp)}
    $plain=$null;$json=$null;$seg=$null
  }
}

function Ver-Estado {
  Mensaje ('PC: '+$env:COMPUTERNAME)
  Mensaje ('Cuenta: '+[Security.Principal.WindowsIdentity]::GetCurrent().Name)
  Mensaje ('DPAPI de este usuario: '+[bool](Test-Path $vault -PathType Leaf))
  Mensaje ('Motor R046: '+[bool](Test-Path $raiz -PathType Container))
  Mensaje ('Manual R052 registrado: '+[bool](Test-Path 'HKCU:\Software\Classes\arma-enel-r052'))
  $t=Get-ScheduledTask -TaskName $tarea -ErrorAction SilentlyContinue
  Mensaje ('Tarea diaria: '+$(if($t){$t.State}else{'NO INSTALADA'}))
  if($t){
    $i=Get-ScheduledTaskInfo -TaskName $tarea -ErrorAction SilentlyContinue
    if($i){Mensaje ('Ultima: '+$i.LastRunTime+' | Codigo: '+$i.LastTaskResult)}
  }
}
function Ejecutar-Manual {
  # Solo en PCs que tengan el robot R061 realmente instalado.
  $ver=Join-Path $raiz 'ENEL_R061_Verificar_Ciclo.ps1'
  $ciclo=Join-Path $raiz 'ENEL_R061_Ciclo_Automatico.ps1'
  if(!(Test-Path $ver) -or !(Test-Path $ciclo)){throw 'R061_NO_INSTALADO_EN_ESTE_PC'}
  if(!(Test-Path $vault)){throw 'DPAPI_NO_CONFIGURADO_EN_ESTE_USUARIO'}
  if(-not(Confirmar '¿Ejecutar descarga e ingesta MANUAL en este PC?')){return}
  & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $ver
  if($LASTEXITCODE -ne 0){throw ('VERIFICADOR_FALLO_'+$LASTEXITCODE)}
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ciclo
  if($LASTEXITCODE -ne 0){throw ('CICLO_FALLO_'+$LASTEXITCODE)}
  Mensaje 'CICLO EJECUTADO. Confirmar recepcion ENEL en Sheets.' 'Green'
}
function Cambiar-Scheduler([bool]$habilitar){
  $t=Get-ScheduledTask -TaskName $tarea -ErrorAction SilentlyContinue
  if(-not $habilitar){
    if(!$t){Mensaje 'TAREA ENEL NO INSTALADA.' 'Yellow';return}
    if(-not(Confirmar '¿Deshabilitar tarea diaria ENEL de ESTE EQUIPO?' 'DESHABILITAR')){return}
    Disable-ScheduledTask -TaskName $tarea -ErrorAction Stop|Out-Null
    Mensaje 'TAREA LOCAL DESHABILITADA. No cambia Sheets directamente.' 'Green';return
  }
  if(!(Test-Path $vault)){throw 'DPAPI_NO_PROVISIONADO'}
  $state=Join-Path $env:LOCALAPPDATA 'ARMA_ENEL_R046\orquestador_r061\estado.json'
  if(!(Test-Path $state)){throw 'SIN_CICLO_MANUAL_VERIFICADO'}
  $j=Get-Content -LiteralPath $state -Raw|ConvertFrom-Json
  if([string]$j.status -cne 'OK'){throw 'ULTIMO_CICLO_NO_OK'}
  if($t){
    $who=[Security.Principal.WindowsIdentity]::GetCurrent().Name
    if([string]$t.Principal.UserId -ine $who){throw 'TAREA_BAJO_OTRO_USUARIO_NO_MODIFICADA'}
    if(-not(Confirmar '¿Habilitar tarea ENEL existente en ESTE EQUIPO?')){return}
    Enable-ScheduledTask -TaskName $tarea -ErrorAction Stop|Out-Null
    Mensaje 'TAREA LOCAL HABILITADA.' 'Green'
  } else {
    $inst=Join-Path $raiz 'ENEL_R065_Programar_Diario.ps1'
    if(!(Test-Path $inst)){throw 'R065_PROGRAMADOR_NO_INSTALADO'}
    if(-not(Confirmar '¿Crear tarea ENEL diaria a las 03:30 en ESTE EQUIPO?' 'INSTALAR')){return}
    & $inst -Habilitar -Hora '03:30' -Nombre $tarea
    if(-not $?){throw 'FALLO_R065_PROGRAMADOR'}
  }
}
$salida=0
try{
  if($env:OS -ne 'Windows_NT'){throw 'SOLO_WINDOWS'}
  Mensaje 'A.R.M.A. ENEL R069.5 - OPERACION LOCAL / DPAPI FIX'
  if($Modo -eq 'InstalarYClave'){
    Instalar-Puente
    Mensaje 'El puente queda listo. Actualizaremos DPAPI ahora si ya cambiaste clave en portal.' 'Green'
    Guardar-DPAPI
  } elseif($Modo -eq 'Clave'){Guardar-DPAPI}
  elseif($Modo -eq 'Manual'){Ejecutar-Manual}
  elseif($Modo -eq 'Estado'){Ver-Estado}
  elseif($Modo -eq 'Activar'){Cambiar-Scheduler $true}
  elseif($Modo -eq 'Deshabilitar'){Cambiar-Scheduler $false}
}catch{
  Mensaje ('ERROR_R0695: '+$_.Exception.Message) 'Red';$salida=1
}finally{
  if($DesdeNavegador){[void](Read-Host 'Pulse ENTER para cerrar')}
}
if($salida){exit 1}

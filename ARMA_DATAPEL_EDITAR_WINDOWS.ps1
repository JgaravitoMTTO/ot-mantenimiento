$ErrorActionPreference='Stop'
$root = Join-Path $env:LOCALAPPDATA 'ARMA\RDP'
$adminRdp = Join-Path $root 'DATAPEL_ADMIN.rdp'
$userRdp  = Join-Path $root 'DATAPEL_USUARIO.rdp'

if (!(Test-Path $adminRdp) -or !(Test-Path $userRdp)) {
    Write-Host 'ARMA DATAPEL NO ESTA INSTALADO EN ESTE USUARIO WINDOWS.' -ForegroundColor Red
    Write-Host 'Vuelva a ARMA > DATAPEL y ejecute la configuracion inicial.' -ForegroundColor Yellow
    pause
    exit 2
}

function Read-RdpLines([string]$Path) {
    return [IO.File]::ReadAllLines($Path,[Text.Encoding]::Unicode)
}
function Set-RdpValue([string[]]$Lines,[string]$Prefix,[string]$Value) {
    $found=$false
    for($i=0;$i -lt $Lines.Count;$i++){
        if($Lines[$i].StartsWith($Prefix,[StringComparison]::OrdinalIgnoreCase)){
            $Lines[$i]=$Value;$found=$true
        }
    }
    if(!$found){ $Lines += $Value }
    return ,$Lines
}
function Get-RdpValue([string[]]$Lines,[string]$Prefix) {
    foreach($line in $Lines){
        if($line.StartsWith($Prefix,[StringComparison]::OrdinalIgnoreCase)){
            return $line.Substring($Prefix.Length)
        }
    }
    return ''
}

$admin = Read-RdpLines $adminRdp
$user  = Read-RdpLines $userRdp
$currentAddress = Get-RdpValue $admin 'full address:s:'
$currentUser = Get-RdpValue $admin 'username:s:'

Clear-Host
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '        ARMA DATAPEL - MODIFICAR CONEXION' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host ('Direccion actual: ' + $currentAddress)
if($currentUser){ Write-Host ('Usuario actual:   ' + $currentUser) }
Write-Host ''

$newAddress = Read-Host ('Nueva direccion [ENTER conserva ' + $currentAddress + ']')
if([string]::IsNullOrWhiteSpace($newAddress)){ $newAddress=$currentAddress }
$newAddress=$newAddress.Trim()

$newUser = Read-Host ('Usuario RDP ADMIN [ENTER conserva ' + ($(if($currentUser){$currentUser}else{'SIN USUARIO FIJO'})) + ']')
if([string]::IsNullOrWhiteSpace($newUser)){ $newUser=$currentUser } else { $newUser=$newUser.Trim() }

$admin = Set-RdpValue $admin 'full address:s:' ('full address:s:'+$newAddress)
$user  = Set-RdpValue $user  'full address:s:' ('full address:s:'+$newAddress)

if($newUser){
    $admin = Set-RdpValue $admin 'username:s:' ('username:s:'+$newUser)
    $admin = Set-RdpValue $admin 'prompt for credentials:i:' 'prompt for credentials:i:0'
}

[IO.File]::WriteAllLines($adminRdp,$admin,[Text.Encoding]::Unicode)
[IO.File]::WriteAllLines($userRdp,$user,[Text.Encoding]::Unicode)

$save = Read-Host 'Desea guardar/reemplazar la contrasena RDP ADMIN en Credenciales de Windows? (S/N)'
if($save -match '^[sS]$'){
    if(!$newUser){
        $newUser = Read-Host 'Usuario RDP ADMIN'
    }
    if($newUser){
        $cred = Get-Credential -UserName $newUser -Message 'ARMA DATAPEL - Credencial RDP ADMIN'
        $bstr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($cred.Password)
        try{
            $plain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
            $hostOnly=$newAddress
            if($newAddress -match '^(.*):(\d+)$'){ $hostOnly=$matches[1] }
            & cmdkey.exe /generic:("TERMSRV/"+$hostOnly) /user:$cred.UserName /pass:$plain | Out-Null
            & cmdkey.exe /generic:("TERMSRV/"+$newAddress) /user:$cred.UserName /pass:$plain | Out-Null
            Write-Host 'Credencial actualizada en Windows Credential Manager.' -ForegroundColor Green
        } finally {
            if($bstr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)}
            $plain=$null
        }
    }
}

Write-Host ''
Write-Host 'CONEXION DATAPEL ACTUALIZADA.' -ForegroundColor Green
Write-Host 'Cierre esta ventana y pulse ABRIR DATAPEL en ARMA.' -ForegroundColor Yellow
Write-Host ''
pause
